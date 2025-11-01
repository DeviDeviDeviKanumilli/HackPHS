import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Trade from '@/models/Trade';
import { requireAuth } from '@/lib/auth';
import { getCoordinatesFromZip, calculateDistance } from '@/lib/geocoding';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get('zip');
    const radius = parseFloat(searchParams.get('radius') || '50');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

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

    const trades = await Trade.find({ status: 'active' })
      .populate('ownerId', 'username')
      .sort({ createdAt: -1 });

    let sortedTrades = trades;

    // Calculate distances if user location is available
    if (userLat !== null && userLng !== null) {
      sortedTrades = trades
        .map((trade) => ({
          trade: trade.toObject(),
          distance: calculateDistance(
            userLat!,
            userLng!,
            trade.coordinates.lat,
            trade.coordinates.lng
          ),
        }))
        .filter((item) => item.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .map((item) => item.trade);
    }

    return NextResponse.json({ trades: sortedTrades }, { status: 200 });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    await dbConnect();

    const coordinates = await getCoordinatesFromZip(locationZip);
    if (!coordinates) {
      return NextResponse.json(
        { error: 'Invalid zip code' },
        { status: 400 }
      );
    }

    const trade = await Trade.create({
      ownerId: user.id,
      offeredItem,
      requestedItem,
      locationZip,
      coordinates,
      offeredPlantId,
      requestedPlantId,
      status: 'active',
    });

    const populatedTrade = await Trade.findById(trade._id).populate('ownerId', 'username');

    return NextResponse.json({ trade: populatedTrade }, { status: 201 });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

