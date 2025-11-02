// Full-text search utilities using PostgreSQL tsvector
import prisma from './db';

/**
 * Create full-text search index for plants
 * Run this migration manually or via Prisma migration
 */
export async function createSearchIndexes() {
  // This would be run as a raw SQL migration
  // Prisma doesn't directly support GIN indexes, so we use raw SQL
  const queries = [
    // Plants full-text search index
    `CREATE INDEX IF NOT EXISTS plants_search_idx ON plants 
     USING gin(to_tsvector('english', 
       COALESCE(name, '') || ' ' || 
       COALESCE(genus, '') || ' ' || 
       COALESCE(species, '') || ' ' || 
       COALESCE(description, '')
     ));`,
    
    // Forum posts full-text search index
    `CREATE INDEX IF NOT EXISTS forum_posts_search_idx ON forum_posts 
     USING gin(to_tsvector('english', 
       COALESCE(title, '') || ' ' || 
       COALESCE(content, '')
     ));`,
  ];

  for (const query of queries) {
    try {
      await prisma.$executeRawUnsafe(query);
      console.log('✅ Created search index');
    } catch (error) {
      console.error('Failed to create search index:', error);
    }
  }
}

/**
 * Search plants using PostgreSQL full-text search
 */
export async function searchPlants(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  const searchQuery = query.trim();

  if (!searchQuery) {
    return { plants: [], total: 0 };
  }

  // Use raw SQL for full-text search with ranking
  const sql = `
    SELECT 
      p.*,
      ts_rank(
        to_tsvector('english', 
          COALESCE(p.name, '') || ' ' || 
          COALESCE(p.genus, '') || ' ' || 
          COALESCE(p.species, '') || ' ' || 
          COALESCE(p.description, '')
        ),
        plainto_tsquery('english', $1)
      ) as rank
    FROM plants p
    WHERE 
      to_tsvector('english', 
        COALESCE(p.name, '') || ' ' || 
        COALESCE(p.genus, '') || ' ' || 
        COALESCE(p.species, '') || ' ' || 
        COALESCE(p.description, '')
      ) @@ plainto_tsquery('english', $1)
    ORDER BY rank DESC, p.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const countSql = `
    SELECT COUNT(*) as total
    FROM plants p
    WHERE 
      to_tsvector('english', 
        COALESCE(p.name, '') || ' ' || 
        COALESCE(p.genus, '') || ' ' || 
        COALESCE(p.species, '') || ' ' || 
        COALESCE(p.description, '')
      ) @@ plainto_tsquery('english', $1)
  `;

  try {
    const [plants, countResult] = await Promise.all([
      prisma.$queryRawUnsafe(sql, searchQuery, limit, offset),
      prisma.$queryRawUnsafe(countSql, searchQuery),
    ]);

    const total = Number((countResult as any[])[0]?.total || 0);

    return {
      plants: plants as any[],
      total,
      page: Math.floor(offset / limit) + 1,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Full-text search error:', error);
    // Fallback to basic search
    return await fallbackPlantSearch(searchQuery, options);
  }
}

/**
 * Fallback to basic Prisma search if full-text search fails
 */
async function fallbackPlantSearch(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  const where: any = {
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { genus: { contains: query, mode: 'insensitive' } },
      { species: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ],
  };

  const [plants, total] = await Promise.all([
    prisma.plant.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.plant.count({ where }),
  ]);

  return {
    plants,
    total,
    page: Math.floor(offset / limit) + 1,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Search forum posts using full-text search
 */
export async function searchForumPosts(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    category?: string;
  }
) {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  const searchQuery = query.trim();

  if (!searchQuery) {
    return { posts: [], total: 0 };
  }

  const categoryClause = options?.category
    ? `AND category = '${options.category}'`
    : '';

  const sql = `
    SELECT 
      fp.*,
      ts_rank(
        to_tsvector('english', 
          COALESCE(fp.title, '') || ' ' || 
          COALESCE(fp.content, '')
        ),
        plainto_tsquery('english', $1)
      ) as rank
    FROM forum_posts fp
    WHERE 
      to_tsvector('english', 
        COALESCE(fp.title, '') || ' ' || 
        COALESCE(fp.content, '')
      ) @@ plainto_tsquery('english', $1)
      ${categoryClause}
    ORDER BY rank DESC, fp.timestamp DESC
    LIMIT $2 OFFSET $3
  `;

  const countSql = `
    SELECT COUNT(*) as total
    FROM forum_posts fp
    WHERE 
      to_tsvector('english', 
        COALESCE(fp.title, '') || ' ' || 
        COALESCE(fp.content, '')
      ) @@ plainto_tsquery('english', $1)
      ${categoryClause}
  `;

  try {
    const [posts, countResult] = await Promise.all([
      prisma.$queryRawUnsafe(sql, searchQuery, limit, offset),
      prisma.$queryRawUnsafe(countSql, searchQuery),
    ]);

    const total = Number((countResult as any[])[0]?.total || 0);

    return {
      posts: posts as any[],
      total,
      page: Math.floor(offset / limit) + 1,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Forum search error:', error);
    // Fallback to basic search
    return await fallbackForumSearch(searchQuery, options);
  }
}

/**
 * Fallback forum search
 */
async function fallbackForumSearch(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    category?: string;
  }
) {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  const where: any = {
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
    ],
  };

  if (options?.category) {
    where.category = options.category;
  }

  const [posts, total] = await Promise.all([
    prisma.forumPost.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'desc' },
      include: {
        author: {
          select: { id: true, username: true },
        },
        _count: {
          select: { replies: true },
        },
      },
    }),
    prisma.forumPost.count({ where }),
  ]);

  return {
    posts,
    total,
    page: Math.floor(offset / limit) + 1,
    pages: Math.ceil(total / limit),
  };
}

