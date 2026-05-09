import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { LaneWithCards, ApiResponse, LaneDoc, CardDoc } from '@/types';

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<LaneWithCards[]>>> {
  try {
    const db = await getDb();
    const lanesCollection = db.collection('lanes');
    const cardsCollection = db.collection('cards');

    // Fetch all lanes sorted by order
    const lanesData = await lanesCollection
      .find({})
      .sort({ order: 1 })
      .toArray() as any[];

    // For each lane, fetch its cards sorted by order
    const lanesWithCards: LaneWithCards[] = await Promise.all(
      lanesData.map(async (laneDoc: any) => {
        const cardsData = await cardsCollection
          .find({ laneId: laneDoc._id.toString() })
          .sort({ order: 1 })
          .toArray() as any[];

        return {
          _id: laneDoc._id.toString(),
          title: laneDoc.title,
          order: laneDoc.order,
          createdAt: laneDoc.createdAt,
          cards: cardsData.map((cardDoc: any) => ({
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
