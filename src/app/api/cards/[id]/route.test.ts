import { ObjectId } from 'mongodb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH } from './route';

const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
}));

vi.mock('@/lib/mongodb', () => ({
  getDb: getDbMock,
}));

describe('PATCH /api/cards/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates a card and returns the updated document', async () => {
    const cardId = new ObjectId().toString();
    const updatedAt = new Date('2026-05-13T00:00:00Z');
    const cardsCollection = {
      findOneAndUpdate: vi.fn().mockResolvedValue({
        _id: new ObjectId(cardId),
        laneId: 'lane-1',
        title: 'Updated title',
        description: 'Updated description',
        order: 0,
        createdAt: new Date('2026-05-09T00:00:00Z'),
        updatedAt,
      }),
    };

    getDbMock.mockResolvedValue({
      collection: vi.fn(() => cardsCollection),
    });

    const response = await PATCH(
      new Request(`http://localhost/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated title',
          description: 'Updated description',
        }),
      }) as never,
      { params: Promise.resolve({ id: cardId }) }
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        _id: cardId,
        laneId: 'lane-1',
        title: 'Updated title',
        description: 'Updated description',
        order: 0,
        createdAt: '2026-05-09T00:00:00.000Z',
        updatedAt: '2026-05-13T00:00:00.000Z',
      },
    });
  });
});
