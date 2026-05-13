import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { ApiResponse, Lane, LaneDoc, MoveLaneRequest, MoveLaneResponse } from '@/types';

function resolveIdQuery(id: string): { _id: ObjectId } | null {
  try {
    return { _id: new ObjectId(id) };
  } catch {
    return null;
  }
}

function toLaneResponse(laneDoc: LaneDoc): Lane {
  return {
    _id: laneDoc._id.toString(),
    title: laneDoc.title,
    order: laneDoc.order,
    createdAt: laneDoc.createdAt,
  };
}

function isValidTargetOrder(targetOrder: unknown): targetOrder is number {
  return typeof targetOrder === 'number' && Number.isInteger(targetOrder) && targetOrder >= 0;
}

function invalidTargetOrderResponse(message: string): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      ok: false,
      error: message,
    },
    { status: 400 }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<MoveLaneResponse>> {
  try {
    const resolvedParams = await params;
    const laneId = resolvedParams.id;
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

    let body: Partial<MoveLaneRequest> = {};
    try {
      const parsedBody = await request.json();
      if (parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody)) {
        body = parsedBody as Partial<MoveLaneRequest>;
      }
    } catch {
      return invalidTargetOrderResponse('Invalid targetOrder: expected a non-negative integer');
    }

    if (!isValidTargetOrder(body.targetOrder)) {
      return invalidTargetOrderResponse('Invalid targetOrder: expected a non-negative integer');
    }

    const db = await getDb();
    const lanesCollection = db.collection('lanes');

    const lanes = (await lanesCollection.find({}).sort({ order: 1 }).toArray()) as LaneDoc[];
    const laneIndex = lanes.findIndex((laneDoc) => laneDoc._id.toString() === laneId);

    if (laneIndex === -1) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Lane not found',
        },
        { status: 404 }
      );
    }

    if (body.targetOrder >= lanes.length) {
      return invalidTargetOrderResponse('Invalid targetOrder: order out of bounds');
    }

    const originalOrders = new Map<string, number>(
      lanes.map((laneDoc) => [laneDoc._id.toString(), laneDoc.order])
    );
    const movedLane = lanes.splice(laneIndex, 1)[0]!;
    lanes.splice(body.targetOrder, 0, movedLane);

    const finalLanes: LaneDoc[] = lanes.map((laneDoc, index) => ({
      ...laneDoc,
      order: index,
    }));

    const bulkOperations = finalLanes.reduce<
      Array<{
        updateOne: {
          filter: { _id: ObjectId };
          update: { $set: { order: number } };
        };
      }>
    >((operations, laneDoc, index) => {
      if (originalOrders.get(laneDoc._id.toString()) !== index) {
        operations.push({
          updateOne: {
            filter: { _id: laneDoc._id },
            update: {
              $set: {
                order: index,
              },
            },
          },
        });
      }

      return operations;
    }, []);

    if (bulkOperations.length > 0) {
      await lanesCollection.bulkWrite(bulkOperations, { ordered: true });
    }

    return NextResponse.json(
      {
        ok: true,
        data: toLaneResponse(finalLanes[body.targetOrder]!),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error moving lane:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to move lane',
      },
      { status: 500 }
    );
  }
}
