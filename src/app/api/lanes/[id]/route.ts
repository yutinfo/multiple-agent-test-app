import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { DeleteLaneResponse, LaneDoc } from '@/types';

function resolveIdQuery(id: string): { _id: ObjectId } | null {
  try {
    return { _id: new ObjectId(id) };
  } catch {
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DeleteLaneResponse>> {
  try {
    const resolvedParams = await params;
    const laneId = resolvedParams.id;

    const db = await getDb();
    const lanesCollection = db.collection('lanes');
    const cardsCollection = db.collection('cards');

    const laneQuery = resolveIdQuery(laneId);
    if (!laneQuery) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Lane not found',
        },
        { status: 404 }
      );
    }

    const lane = (await lanesCollection.findOne(laneQuery)) as LaneDoc | null;

    if (!lane) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Lane not found',
        },
        { status: 404 }
      );
    }

    const cardsCount = await cardsCollection.countDocuments({ laneId: lane._id.toString() });
    if (cardsCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Lane cannot be deleted because it still contains cards',
        },
        { status: 409 }
      );
    }

    const remainingLaneCount = await lanesCollection.countDocuments({});
    if (remainingLaneCount <= 1) {
      return NextResponse.json(
        {
          ok: false,
          error: 'At least one lane must remain',
        },
        { status: 409 }
      );
    }

    const deleteResult = await lanesCollection.deleteOne(laneQuery);
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Lane not found',
        },
        { status: 404 }
      );
    }

    await lanesCollection.updateMany(
      { order: { $gt: lane.order } },
      { $inc: { order: -1 } }
    );

    return NextResponse.json(
      {
        ok: true,
        data: {
          _id: lane._id.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting lane:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to delete lane',
      },
      { status: 500 }
    );
  }
}
