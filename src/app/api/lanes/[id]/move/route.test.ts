import { ObjectId } from 'mongodb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH } from './route';

const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
}));

vi.mock('@/lib/mongodb', () => ({
  getDb: getDbMock,
}));

function makeLane(title: string, order: number, id?: ObjectId) {
  return {
    _id: id ?? new ObjectId(),
    title,
    order,
    createdAt: new Date('2026-05-13T00:00:00Z'),
  };
}

function makeLanesCollection(lanes: ReturnType<typeof makeLane>[]) {
  const toArray = vi.fn().mockResolvedValue(lanes);
  const sort = vi.fn().mockReturnValue({ toArray });
  const find = vi.fn().mockReturnValue({ sort });
  const bulkWrite = vi.fn().mockResolvedValue({ acknowledged: true });

  return {
    find,
    bulkWrite,
  };
}

describe('PATCH /api/lanes/:id/move', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('moves a lane to a new position and normalizes orders', async () => {
    const todoLane = makeLane('Todo', 0);
    const reviewLane = makeLane('Review', 1);
    const doneLane = makeLane('Done', 2);
    const lanesCollection = makeLanesCollection([todoLane, reviewLane, doneLane]);

    getDbMock.mockResolvedValue({
      collection: vi.fn(() => lanesCollection),
    });

    const response = await PATCH(
      new Request(`http://localhost/api/lanes/${doneLane._id.toString()}`, {
        method: 'PATCH',
        body: JSON.stringify({ targetOrder: 0 }),
      }) as never,
      { params: Promise.resolve({ id: doneLane._id.toString() }) }
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        _id: doneLane._id.toString(),
        title: 'Done',
        order: 0,
        createdAt: doneLane.createdAt.toISOString(),
      },
    });
    expect(lanesCollection.bulkWrite).toHaveBeenCalledTimes(1);
    expect(lanesCollection.bulkWrite).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          updateOne: expect.objectContaining({
            filter: { _id: expect.any(ObjectId) },
          }),
        }),
      ]),
      { ordered: true }
    );
  });

  it('rejects a missing or invalid targetOrder', async () => {
    const todoLane = makeLane('Todo', 0);
    const reviewLane = makeLane('Review', 1);
    const lanesCollection = makeLanesCollection([todoLane, reviewLane]);

    getDbMock.mockResolvedValue({
      collection: vi.fn(() => lanesCollection),
    });

    const response = await PATCH(
      new Request(`http://localhost/api/lanes/${todoLane._id.toString()}`, {
        method: 'PATCH',
        body: JSON.stringify({}),
      }) as never,
      { params: Promise.resolve({ id: todoLane._id.toString() }) }
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: 'Invalid targetOrder: expected a non-negative integer',
    });
    expect(lanesCollection.bulkWrite).not.toHaveBeenCalled();
  });

  it('rejects out-of-bounds targetOrder', async () => {
    const todoLane = makeLane('Todo', 0);
    const reviewLane = makeLane('Review', 1);
    const lanesCollection = makeLanesCollection([todoLane, reviewLane]);

    getDbMock.mockResolvedValue({
      collection: vi.fn(() => lanesCollection),
    });

    const response = await PATCH(
      new Request(`http://localhost/api/lanes/${todoLane._id.toString()}`, {
        method: 'PATCH',
        body: JSON.stringify({ targetOrder: 2 }),
      }) as never,
      { params: Promise.resolve({ id: todoLane._id.toString() }) }
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: 'Invalid targetOrder: order out of bounds',
    });
    expect(lanesCollection.bulkWrite).not.toHaveBeenCalled();
  });

  it('returns 404 when the lane is not found', async () => {
    const todoLane = makeLane('Todo', 0);
    const lanesCollection = makeLanesCollection([todoLane]);

    getDbMock.mockResolvedValue({
      collection: vi.fn(() => lanesCollection),
    });

    const missingLaneId = new ObjectId().toString();
    const response = await PATCH(
      new Request(`http://localhost/api/lanes/${missingLaneId}`, {
        method: 'PATCH',
        body: JSON.stringify({ targetOrder: 0 }),
      }) as never,
      { params: Promise.resolve({ id: missingLaneId }) }
    );

    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: 'Lane not found',
    });
    expect(lanesCollection.bulkWrite).not.toHaveBeenCalled();
  });
});
