import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { getCoordinatesFromZip, calculateDistance } from '@/lib/geocoding';
import { apiCache, getCacheTTL, generateKey } from '@/lib/apiCache';
import { formatTradeResponse, TradeWithRelations } from '@/lib/tradeFormatter';
import { tradeInclude } from '@/lib/tradeIncludes';

// Invalidate cache when trades are created/updated
async function invalidateTradeCache() {
  await apiCache.invalidate('/api/trades');
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const zipCode = searchParams.get('zip');
    const radius = parseFloat(searchParams.get('radius') || '50');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Check cache for GET requests (skip if location-based as it's more dynamic)
    const cacheKey = generateKey(url.pathname, Object.fromEntries(searchParams.entries()));
    if (!zipCode && !lat) {
      // Only cache non-location queries
      const cached = await apiCache.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          status: 200,
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
          },
        });
      }
    }

    let userLat: number | null = null;
    let userLng: number | null = null;

    if (lat && lng) {
      userLat = parseFloat(lat);
      userLng = parseFloat(lng);
    } else if (zipCode) {
      const coords = await getCoordinatesFromZip(zipCode);
      if (coords) {
        userLat = coords.lat;
        userLng = coords.lng;
      }
    }

    const currentUser = await getCurrentUser();
    const currentUserId = currentUser?.id ?? null;

    let trades;

    // Use geospatial query if location is provided
    if (userLat !== null && userLng !== null) {
      // PostgreSQL-optimized: Use bounding box first, then filter by distance
      // This reduces the number of records we need to calculate distance for
      const boundingRadius = radius / 69; // Rough miles to degrees conversion (1 degree ≈ 69 miles)
      const latMin = userLat - boundingRadius;
      const latMax = userLat + boundingRadius;
      const lngMin = userLng - boundingRadius;
      const lngMax = userLng + boundingRadius;
      
      // Get trades within bounding box first (uses index on latitude, longitude)
      const allTrades = await prisma.trade.findMany({
        where: {
          status: 'active',
          latitude: {
            gte: latMin,
            lte: latMax,
          },
          longitude: {
            gte: lngMin,
            lte: lngMax,
          },
        },
        include: tradeInclude,
        take: Math.min(limit * 3, 500), // Get more candidates for distance filtering
      });

      // Calculate distances and filter
      const tradesWithDistance = allTrades
        .map((trade) => {
          if (trade.latitude === null || trade.longitude === null) return null;
          const distance = calculateDistance(userLat!, userLng!, trade.latitude, trade.longitude);
          return {
            distance,
            formatted: formatTradeResponse(trade as TradeWithRelations, {
              currentUserId,
              distance: Math.round(distance * 10) / 10,
            }),
          };
        })
        .filter((entry): entry is { distance: number; formatted: ReturnType<typeof formatTradeResponse> } => {
          return entry !== null && entry.distance <= radius;
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      trades = tradesWithDistance.map((entry) => entry.formatted);
      console.log(`Found ${trades.length} trades within ${radius} miles`);
    } else {
      // If no location filter, show all active trades - optimized select
      const tradesQuery = await prisma.trade.findMany({
        where: { status: 'active' },
        include: tradeInclude,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      trades = tradesQuery.map((trade) =>
        formatTradeResponse(trade as TradeWithRelations, { currentUserId })
      );

      console.log(`Found ${trades.length} trades (no location filter)`);
    }

    // Cache the response (only for non-location queries)
    if (!zipCode && !lat) {
      const ttl = getCacheTTL('/api/trades');
      await apiCache.set(cacheKey, { trades }, ttl);
    }

    return NextResponse.json(
      { trades },
      {
        status: 200,
        headers: {
          'X-Cache': zipCode || lat ? 'SKIP' : 'MISS',
          'Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { offeredItem, requestedItem, locationZip, offeredPlantId, requestedPlantId } = await request.json();

    if (!offeredItem || !requestedItem || !locationZip) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const coordinates = await getCoordinatesFromZip(locationZip);
    if (!coordinates) {
      return NextResponse.json(
        { error: 'Invalid zip code. Please enter a valid US zip code.' },
        { status: 400 }
      );
    }

    console.log(`Creating trade with coordinates for zip ${locationZip}:`, coordinates);

    const trade = await prisma.trade.create({
      data: {
        ownerId: user.id,
        offeredItem,
        requestedItem,
        locationZip,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        offeredPlantId: offeredPlantId || null,
        requestedPlantId: requestedPlantId || null,
        status: 'active',
      },
      include: tradeInclude,
    });

    const populatedTrade = formatTradeResponse(trade as TradeWithRelations, {
      currentUserId: user.id,
    });

    // Invalidate cache after creating trade
    await invalidateTradeCache();

    return NextResponse.json({ trade: populatedTrade }, { status: 201 });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

