import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { CreateCardRequest, Card, ApiResponse, CardDoc } from '@/types';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Card>>> {
  try {
    const body: CreateCardRequest = await request.json();

    // Validate required fields
    if (!body.laneId || !body.title) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required field: laneId or title',
        },
        { status: 400 }
      );
    }

    const db = await getDb();
    const lanesCollection = db.collection('lanes');
    const cardsCollection = db.collection('cards');

    // Check if lane exists - handle both string and ObjectId
    let laneQuery: any = { _id: body.laneId };
    try {
      laneQuery = { _id: new ObjectId(body.laneId) };
    } catch {
      // If it's not a valid ObjectId, keep it as string
    }

    const lane = await lanesCollection.findOne(laneQuery) as any;

    if (!lane) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Lane not found',
        },
        { status: 404 }
      );
    }

    // Find max order in the lane
    const maxOrderCard = await cardsCollection
      .findOne(
        { laneId: body.laneId },
        { sort: { order: -1 } }
      ) as any;

    const nextOrder = maxOrderCard ? maxOrderCard.order + 1 : 0;

    // Create new card
    const cardData: Partial<CardDoc> = {
      laneId: body.laneId,
      title: body.title,
      order: nextOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (body.description !== undefined) {
      cardData.description = body.description;
    }

    const result = await cardsCollection.insertOne(cardData);

    const card: Card = {
      _id: result.insertedId.toString(),
      laneId: body.laneId,
      title: body.title,
      description: body.description,
      order: nextOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(
      {
        ok: true,
        data: card,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create card',
      },
      { status: 500 }
    );
  }
}
