import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { MoveCardRequest, Card, ApiResponse, CardDoc, LaneDoc } from '@/types';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Card>>> {
  try {
    const resolvedParams = await params;
    const cardId = resolvedParams.id;
    const body: MoveCardRequest = await request.json();

    // Validate required fields
    if (!body.targetLaneId || body.targetOrder === undefined) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required field: targetLaneId or targetOrder',
        },
        { status: 400 }
      );
    }

    const db = await getDb();
    const cardsCollection = db.collection('cards');
    const lanesCollection = db.collection('lanes');

    // Validate targetOrder >= 0
    if (body.targetOrder < 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid targetOrder: order out of bounds',
        },
        { status: 400 }
      );
    }

    // Get the card to move - handle both string and ObjectId
    let cardQuery: any = { _id: cardId };
    try {
      cardQuery = { _id: new ObjectId(cardId) };
    } catch {
      // Keep as string
    }

    const card = await cardsCollection.findOne(cardQuery) as CardDoc | null;

    if (!card) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Card not found',
        },
        { status: 404 }
      );
    }

    // Verify target lane exists
    let laneQuery: any = { _id: body.targetLaneId };
    try {
      laneQuery = { _id: new ObjectId(body.targetLaneId) };
    } catch {
      // Keep as string
    }

    const targetLane = await lanesCollection.findOne(laneQuery) as LaneDoc | null;

    if (!targetLane) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Target lane not found',
        },
        { status: 404 }
      );
    }

    // Validate targetOrder <= cardsInTargetLane.length
    const cardsInTargetLane = await cardsCollection
      .find({ laneId: body.targetLaneId })
      .toArray();

    if (body.targetOrder > cardsInTargetLane.length) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid targetOrder: order out of bounds',
        },
        { status: 400 }
      );
    }

    const sourceLaneId = card.laneId;
    const isMovingToSameLane = sourceLaneId === body.targetLaneId;

    // Handle reordering
    if (isMovingToSameLane) {
      // Moving within the same lane
      const currentOrder = card.order;
      const targetOrder = body.targetOrder;

      if (currentOrder < targetOrder) {
        // Moving down: decrement cards between current and target
        await cardsCollection.updateMany(
          {
            laneId: sourceLaneId,
            order: { $gt: currentOrder, $lte: targetOrder },
          },
          { $inc: { order: -1 } }
        );
      } else if (currentOrder > targetOrder) {
        // Moving up: increment cards between target and current
        await cardsCollection.updateMany(
          {
            laneId: sourceLaneId,
            order: { $gte: targetOrder, $lt: currentOrder },
          },
          { $inc: { order: 1 } }
        );
      }
    } else {
      // Moving to a different lane
      // Decrement orders of cards after the current position in source lane
      await cardsCollection.updateMany(
        {
          laneId: sourceLaneId,
          order: { $gt: card.order },
        },
        { $inc: { order: -1 } }
      );

      // Increment orders of cards at targetOrder and after in target lane
      await cardsCollection.updateMany(
        {
          laneId: body.targetLaneId,
          order: { $gte: body.targetOrder },
        },
        { $inc: { order: 1 } }
      );
    }

    // Update the moved card
    const result = await cardsCollection.findOneAndUpdate(
      cardQuery,
      {
        $set: {
          laneId: body.targetLaneId,
          order: body.targetOrder,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result || !result.value) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to update card',
        },
        { status: 500 }
      );
    }

    const cardValue = result.value as CardDoc;
    const updatedCard: Card = {
      _id: cardValue._id.toString(),
      laneId: typeof cardValue.laneId === 'string' ? cardValue.laneId : cardValue.laneId.toString(),
      title: cardValue.title,
      description: cardValue.description,
      order: cardValue.order,
      createdAt: cardValue.createdAt,
      updatedAt: cardValue.updatedAt,
    };

    return NextResponse.json(
      {
        ok: true,
        data: updatedCard,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error moving card:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to move card',
      },
      { status: 500 }
    );
  }
}
