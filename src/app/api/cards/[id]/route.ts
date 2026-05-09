import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { UpdateCardRequest, Card, ApiResponse, DeleteCardResponse, CardDoc } from '@/types';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Card>>> {
  try {
    const resolvedParams = await params;
    const cardId = resolvedParams.id;
    const body: UpdateCardRequest = await request.json();

    // Validate that at least one field is provided
    if (body.title === undefined && body.description === undefined) {
      return NextResponse.json(
        {
          ok: false,
          error: 'At least one field (title or description) must be provided',
        },
        { status: 400 }
      );
    }

    const db = await getDb();
    const cardsCollection = db.collection('cards');

    // Update the card
    const updateData: Partial<CardDoc> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) {
      updateData.title = body.title;
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    let cardQuery: any = { _id: cardId };
    try {
      cardQuery = { _id: new ObjectId(cardId) };
    } catch {
      // If it's not a valid ObjectId, keep it as string
    }

    const updateDataTyped = updateData as any;
    const result = await cardsCollection.findOneAndUpdate(
      cardQuery,
      { $set: updateDataTyped },
      { returnDocument: 'after' }
    );

    if (!result || !result.value) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Card not found',
        },
        { status: 404 }
      );
    }

    const cardValue = result.value as CardDoc;
    const card: Card = {
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
        data: card,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to update card',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DeleteCardResponse>> {
  try {
    const resolvedParams = await params;
    const cardId = resolvedParams.id;

    const db = await getDb();
    const cardsCollection = db.collection('cards');

    let cardQuery: any = { _id: cardId };
    try {
      cardQuery = { _id: new ObjectId(cardId) };
    } catch {
      // If it's not a valid ObjectId, keep it as string
    }

    // Fetch the card first to get its actual _id
    const cardToDelete = await cardsCollection.findOne(cardQuery) as CardDoc | null;

    if (!cardToDelete) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Card not found',
        },
        { status: 404 }
      );
    }

    const result = await cardsCollection.deleteOne(cardQuery);

    return NextResponse.json(
      {
        ok: true,
        data: {
          _id: cardToDelete._id.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to delete card',
      },
      { status: 500 }
    );
  }
}
