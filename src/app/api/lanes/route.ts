import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import {
  ApiResponse,
  CardDoc,
  CreateLaneRequest,
  CreateLaneResponse,
  Lane,
  LaneDoc,
  LaneWithCards,
} from '@/types';

function toLaneResponse(laneDoc: LaneDoc): Lane {
  return {
    _id: laneDoc._id.toString(),
    title: laneDoc.title,
    order: laneDoc.order,
    createdAt: laneDoc.createdAt,
  };
}

function normalizeLaneTitle(title: unknown): string | null {
  if (typeof title !== 'string') {
    return null;
  }

  const trimmedTitle = title.trim();
  return trimmedTitle ? trimmedTitle : null;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<LaneWithCards[]>>> {
  try {
    const db = await getDb();
    const lanesCollection = db.collection('lanes');
    const cardsCollection = db.collection('cards');

    const lanesData = (await lanesCollection.find({}).sort({ order: 1 }).toArray()) as LaneDoc[];

    const lanesWithCards: LaneWithCards[] = await Promise.all(
      lanesData.map(async (laneDoc) => {
        const cardsData = (await cardsCollection
          .find({ laneId: laneDoc._id.toString() })
          .sort({ order: 1 })
          .toArray()) as CardDoc[];

        return {
          ...toLaneResponse(laneDoc),
          cards: cardsData.map((cardDoc) => ({
            _id: cardDoc._id.toString(),
            laneId: typeof cardDoc.laneId === 'string' ? cardDoc.laneId : cardDoc.laneId.toString(),
            title: cardDoc.title,
            description: cardDoc.description,
            order: cardDoc.order,
            createdAt: cardDoc.createdAt,
            updatedAt: cardDoc.updatedAt,
          })),
        };
      })
    );

    return NextResponse.json(
      {
        ok: true,
        data: lanesWithCards,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching lanes:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to retrieve lanes',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateLaneResponse>> {
  try {
    const body = (await request.json()) as Partial<CreateLaneRequest>;
    const title = normalizeLaneTitle(body.title);

    if (!title) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Lane title is required',
        },
        { status: 400 }
      );
    }

    const db = await getDb();
    const lanesCollection = db.collection('lanes');

    const existingLane = await lanesCollection.findOne(
      { title },
      { collation: { locale: 'en', strength: 2 } }
    );

    if (existingLane) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Lane title already exists',
        },
        { status: 409 }
      );
    }

    const lastLane = (await lanesCollection.findOne({}, { sort: { order: -1 } })) as LaneDoc | null;
    const laneDoc: LaneDoc = {
      _id: new ObjectId(),
      title,
      order: lastLane ? lastLane.order + 1 : 0,
      createdAt: new Date(),
    };

    await lanesCollection.insertOne(laneDoc);

    return NextResponse.json(
      {
        ok: true,
        data: toLaneResponse(laneDoc),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating lane:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create lane',
      },
      { status: 500 }
    );
  }
}
