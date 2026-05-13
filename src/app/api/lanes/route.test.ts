import { ObjectId } from 'mongodb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
}));

vi.mock('@/lib/mongodb', () => ({
  getDb: getDbMock,
}));

describe('POST /api/lanes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a lane at the end of the board', async () => {
    const lanesCollection = {
      findOne: vi.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ _id: new ObjectId(), title: 'Done', order: 2, createdAt: new Date() }),
      insertOne: vi.fn().mockResolvedValue({}),
    };

    getDbMock.mockResolvedValue({
      collection: vi.fn(() => lanesCollection),
    });

    const response = await POST(
      new Request('http://localhost/api/lanes', {
        method: 'POST',
        body: JSON.stringify({ title: '  Review  ' }),
      }) as unknown as Parameters<typeof POST>[0]
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.title).toBe('Review');
    expect(body.data.order).toBe(3);
    expect(lanesCollection.insertOne).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty lane title', async () => {
    const response = await POST(
      new Request('http://localhost/api/lanes', {
        method: 'POST',
        body: JSON.stringify({ title: '   ' }),
      }) as unknown as Parameters<typeof POST>[0]
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: 'Lane title is required',
    });
  });

  it('rejects duplicate lane titles case-insensitively', async () => {
    const lanesCollection = {
      findOne: vi.fn().mockResolvedValue({
        _id: new ObjectId(),
        title: 'Review',
        order: 3,
        createdAt: new Date(),
      }),
      insertOne: vi.fn(),
    };

    getDbMock.mockResolvedValue({
      collection: vi.fn(() => lanesCollection),
    });

    const response = await POST(
      new Request('http://localhost/api/lanes', {
        method: 'POST',
        body: JSON.stringify({ title: 'review' }),
      }) as unknown as Parameters<typeof POST>[0]
    );

    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: 'Lane title already exists',
    });
  });
});
