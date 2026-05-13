import { ObjectId } from 'mongodb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE } from './route';

const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
}));

vi.mock('@/lib/mongodb', () => ({
  getDb: getDbMock,
}));

describe('DELETE /api/lanes/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes an empty lane and renumbers remaining lanes', async () => {
    const laneId = new ObjectId().toString();
    const lane = {
      _id: new ObjectId(laneId),
      title: 'Review',
      order: 2,
      createdAt: new Date(),
    };

    const lanesCollection = {
      findOne: vi.fn().mockResolvedValue(lane),
      countDocuments: vi.fn().mockResolvedValue(3),
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      updateMany: vi.fn().mockResolvedValue({}),
    };

    const cardsCollection = {
      countDocuments: vi.fn().mockResolvedValue(0),
    };

    getDbMock.mockResolvedValue({
      collection: vi.fn((name: string) => {
        if (name === 'lanes') {
          return lanesCollection;
        }

        return cardsCollection;
      }),
    });

    const response = await DELETE(
      new Request(`http://localhost/api/lanes/${laneId}`, {
        method: 'DELETE',
      }) as never,
      { params: Promise.resolve({ id: laneId }) }
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        _id: laneId,
      },
    });
    expect(lanesCollection.updateMany).toHaveBeenCalledWith(
      { order: { $gt: 2 } },
      { $inc: { order: -1 } }
    );
  });

  it('rejects deletion when the lane still has cards', async () => {
    const laneId = new ObjectId().toString();
    const lane = {
      _id: new ObjectId(laneId),
      title: 'Review',
      order: 2,
      createdAt: new Date(),
    };

    const lanesCollection = {
      findOne: vi.fn().mockResolvedValue(lane),
      countDocuments: vi.fn().mockResolvedValue(3),
      deleteOne: vi.fn(),
      updateMany: vi.fn(),
    };

    const cardsCollection = {
      countDocuments: vi.fn().mockResolvedValue(2),
    };

    getDbMock.mockResolvedValue({
      collection: vi.fn((name: string) => {
        if (name === 'lanes') {
          return lanesCollection;
        }

        return cardsCollection;
      }),
    });

    const response = await DELETE(
      new Request(`http://localhost/api/lanes/${laneId}`, {
        method: 'DELETE',
      }) as never,
      { params: Promise.resolve({ id: laneId }) }
    );

    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: 'Lane cannot be deleted because it still contains cards',
    });
    expect(lanesCollection.deleteOne).not.toHaveBeenCalled();
  });

  it('rejects deletion of the final remaining lane', async () => {
    const laneId = new ObjectId().toString();
    const lane = {
      _id: new ObjectId(laneId),
      title: 'Todo',
      order: 0,
      createdAt: new Date(),
    };

    const lanesCollection = {
      findOne: vi.fn().mockResolvedValue(lane),
      countDocuments: vi.fn().mockResolvedValue(1),
      deleteOne: vi.fn(),
      updateMany: vi.fn(),
    };

    const cardsCollection = {
      countDocuments: vi.fn().mockResolvedValue(0),
    };

    getDbMock.mockResolvedValue({
      collection: vi.fn((name: string) => {
        if (name === 'lanes') {
          return lanesCollection;
        }

        return cardsCollection;
      }),
    });

    const response = await DELETE(
      new Request(`http://localhost/api/lanes/${laneId}`, {
        method: 'DELETE',
      }) as never,
      { params: Promise.resolve({ id: laneId }) }
    );

    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: 'At least one lane must remain',
    });
    expect(lanesCollection.deleteOne).not.toHaveBeenCalled();
  });
});
