import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiCache, getCacheTTL, generateKey } from '@/lib/apiCache';
import { searchPlants } from '@/lib/search';

// Invalidate cache when plants are created/updated
async function invalidatePlantCache() {
  await apiCache.invalidate('/api/plants');
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Cap at 100
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
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        },
      });
    }

    // Use full-text search if search query provided
    if (search) {
      try {
        const searchResults = await searchPlants(search, {
          limit,
          offset: skip,
        });

        const formattedPlants = searchResults.plants.map((plant: any) => ({
          id: plant.id,
          _id: plant.id,
          name: plant.name,
          genus: plant.genus,
          species: plant.species,
          description: plant.description,
          imageURL: plant.image_url || plant.imageURL,
          cycle: plant.cycle,
          wateringFrequency: plant.watering_frequency || plant.wateringFrequency,
          nativeRegion: plant.native_region || plant.nativeRegion,
          careTips: plant.care_tips || plant.careTips,
          tradeStatus: plant.trade_status || plant.tradeStatus,
          idealTemp: plant.ideal_temp || plant.idealTemp,
          sunlight: plant.sunlight,
          createdAt: plant.created_at || plant.createdAt,
          rank: plant.rank, // Include search ranking
        }));

        const response = {
          plants: formattedPlants,
          ...(includeCount && {
            pagination: {
              page: searchResults.page,
              limit,
              total: searchResults.total,
              pages: searchResults.pages,
            },
          }),
        };

        // Cache the response
        const ttl = getCacheTTL('/api/plants');
        await apiCache.set(cacheKey, response, ttl);

        return NextResponse.json(response, {
          status: 200,
          headers: {
            'X-Cache': 'MISS',
            'X-Search-Method': 'fulltext',
            'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          },
        });
      } catch (error) {
        console.error('Full-text search failed, falling back to basic search:', error);
        // Fall through to basic search
      }
    }

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { genus: { contains: search, mode: 'insensitive' } },
        { species: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Optimize: Only fetch count if needed
    const queries = [
      prisma.plant.findMany({
        where,
        select: {
          id: true,
          name: true,
          genus: true,
          species: true,
          description: true,
          imageURL: true,
          cycle: true,
          wateringFrequency: true,
          nativeRegion: true,
          careTips: true,
          tradeStatus: true,
          idealTemp: true,
          sunlight: true,
          createdAt: true,
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

    const formattedPlants = plants.map((plant) => ({
      ...plant,
      _id: plant.id,
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
    await apiCache.set(cacheKey, response, ttl);

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
    // No authentication required - plants are public database entries
    const plantData = await request.json();

    if (!plantData.name || !plantData.description) {
      return NextResponse.json(
        { error: 'Missing required fields: name and description are required' },
        { status: 400 }
      );
    }

    const plant = await prisma.plant.create({
      data: {
        name: plantData.name,
        genus: plantData.genus || null,
        species: plantData.species || null,
        description: plantData.description,
        imageURL: plantData.imageURL || '/placeholder-plant.jpg',
        cycle: plantData.cycle || null,
        wateringFrequency: plantData.wateringFrequency || null,
        nativeRegion: plantData.nativeRegion || null,
        careTips: plantData.careTips || null,
        tradeStatus: plantData.tradeStatus || 'available',
        idealTemp: plantData.idealTemp || null,
        sunlight: plantData.sunlight || null,
      },
    });

    const formattedPlant = {
      ...plant,
      _id: plant.id,
    };

    // Invalidate cache after creating plant
    await invalidatePlantCache();

    return NextResponse.json({ plant: formattedPlant }, { status: 201 });
  } catch (error) {
    console.error('Error creating plant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

