import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiCache, getCacheTTL, generateKey } from '@/lib/apiCache';

// Invalidate cache when plants are created/updated
function invalidatePlantCache() {
  apiCache.invalidate('/api/plants');
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = searchParams.get('search');
    const ownerId = searchParams.get('ownerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Cap at 100
    const skip = (page - 1) * limit;
    const includeCount = searchParams.get('count') !== 'false'; // Allow skipping count

    // Check cache for GET requests
    const cacheKey = generateKey(url.pathname, Object.fromEntries(searchParams.entries()));
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        },
      });
    }

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { scientificName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Optimize: Only fetch count if needed
    const queries = [
      prisma.plant.findMany({
        where,
        select: {
          id: true,
          ownerId: true,
          name: true,
          scientificName: true,
          description: true,
          imageURL: true,
          type: true,
          maintenanceLevel: true,
          tradeStatus: true,
          nativeRegion: true,
          careTips: true,
          createdAt: true,
          owner: {
            select: { id: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ];

    // Only fetch count if requested
    if (includeCount) {
      queries.push(prisma.plant.count({ where }));
    }

    const results = await Promise.all(queries);
    const plants = results[0] as typeof results[0];
    const total = includeCount ? (results[1] as number) : undefined;

    const formattedPlants = plants.map(({ owner, ...plant }) => ({
      ...plant,
      ownerId: {
        _id: owner.id,
        username: owner.username,
      },
    }));

    const response = {
      plants: formattedPlants,
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
    const ttl = getCacheTTL('/api/plants');
    apiCache.set(cacheKey, response, ttl);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching plants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const plantData = await request.json();

    if (!plantData.name || !plantData.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const plant = await prisma.plant.create({
      data: {
        ...plantData,
        ownerId: user.id,
      },
      include: {
        owner: {
          select: { id: true, username: true },
        },
      },
    });

    const populatedPlant = {
      ...plant,
      ownerId: {
        _id: plant.owner.id,
        username: plant.owner.username,
      },
    };

    // Invalidate cache after creating plant
    invalidatePlantCache();

    return NextResponse.json({ plant: populatedPlant }, { status: 201 });
  } catch (error) {
    console.error('Error creating plant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

