import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiCache, getCacheTTL, generateKey } from '@/lib/apiCache';
import { moderateText } from '@/lib/contentModeration';

// Invalidate cache when posts are created/updated
async function invalidateForumCache() {
  await apiCache.invalidate('/api/forum');
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const includeCount = searchParams.get('count') !== 'false'; // Allow skipping count

    // Check cache for GET requests
    const cacheKey = generateKey(url.pathname, Object.fromEntries(searchParams.entries()));
    const cached = await apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=20, stale-while-revalidate=40',
        },
      });
    }

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Optimize: Only fetch count if needed
    const queries = [
      prisma.forumPost.findMany({
        where,
        select: {
          id: true,
          authorId: true,
          title: true,
          content: true,
          category: true,
          timestamp: true,
          createdAt: true,
          author: {
            select: { id: true, username: true },
          },
          _count: {
            select: { replies: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
    ];

    // Only fetch count if requested
    if (includeCount) {
      queries.push(prisma.forumPost.count({ where }));
    }

    const results = await Promise.all(queries);
    const posts = results[0] as typeof results[0];
    const total = includeCount ? (results[1] as number) : undefined;

    const formattedPosts = posts.map(({ author, _count, ...post }) => ({
      ...post,
      _id: post.id,
      timestamp: post.timestamp.toISOString(),
      authorId: {
        _id: author.id,
        username: author.username,
      },
      replies: new Array(_count.replies).fill(null), // Create array with replies count for length property
    }));

    const response = {
      posts: formattedPosts,
      ...(total !== undefined && {
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }),
    };

    // Cache the response
    const ttl = getCacheTTL('/api/forum');
    await apiCache.set(cacheKey, response, ttl);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=20, stale-while-revalidate=40',
      },
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { title, content, category } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Content moderation
    try {
      const moderationResult = await moderateText(`${title} ${content}`, {
        checkToxicity: true,
        checkSpam: true,
      });
      if (!moderationResult.approved) {
        return NextResponse.json(
          { error: `Content rejected: ${moderationResult.reasons.join(', ')}` },
          { status: 400 }
        );
      }
    } catch (error) {
      // Don't fail if moderation service is unavailable
      console.error('Content moderation error:', error);
    }

    const post = await prisma.forumPost.create({
      data: {
        authorId: user.id,
        title,
        content,
        category: category || 'general',
      },
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
    });

    const populatedPost = {
      ...post,
      authorId: {
        _id: post.author.id,
        username: post.author.username,
      },
    };

    // Invalidate cache after creating post
    await invalidateForumCache();

    return NextResponse.json({ post: populatedPost }, { status: 201 });
  } catch (error) {
    console.error('Error creating forum post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

