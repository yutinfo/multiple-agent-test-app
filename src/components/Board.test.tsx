import { ObjectId } from 'mongodb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Board from './Board';
import { LaneWithCards } from '@/types';

function makeLane(title: string, order: number, cards: LaneWithCards['cards'] = []): LaneWithCards {
  return {
    _id: new ObjectId().toString(),
    title,
    order,
    createdAt: new Date('2026-05-13T00:00:00Z'),
    cards,
  };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('Board lane management', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('creates a lane, validates blank titles, and keeps card creation working', async () => {
    const user = userEvent.setup();
    const todoLane = makeLane('Todo', 0);
    const doneLane = makeLane('Done', 1);
    const createdLaneId = new ObjectId().toString();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/lanes' && method === 'POST') {
        return jsonResponse({
          ok: true,
          data: {
            _id: createdLaneId,
            title: 'Review',
            order: 2,
            createdAt: '2026-05-13T00:00:00.000Z',
          },
        }, 201);
      }

      if (url === '/api/cards' && method === 'POST') {
        return jsonResponse({
          ok: true,
          data: {
            _id: new ObjectId().toString(),
            laneId: todoLane._id,
            title: 'Fix login bug',
            description: 'Users cannot reset password via email',
            order: 0,
            createdAt: '2026-05-13T00:00:00.000Z',
            updatedAt: '2026-05-13T00:00:00.000Z',
          },
        }, 201);
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });

    render(<Board initialLanes={[todoLane, doneLane]} />);

    await user.click(screen.getByRole('button', { name: /\+ add lane/i }));
    expect(screen.getByPlaceholderText(/enter lane title/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^add lane$/i }));
    expect(screen.getByText(/please enter a lane title/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/enter lane title/i), 'Review');
    await user.click(screen.getByRole('button', { name: /^add lane$/i }));

    await screen.findByRole('heading', { name: 'Review' });
    expect(screen.getByRole('heading', { name: 'Kanban Board' })).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /\+ add card/i })[0]);
    await user.type(screen.getByPlaceholderText(/card title/i), 'Fix login bug');
    await user.type(
      screen.getByPlaceholderText(/card description/i),
      'Users cannot reset password via email'
    );
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await screen.findByText('Fix login bug');
    expect(screen.getByText('Users cannot reset password via email')).toBeInTheDocument();
  });

  it('deletes an empty lane after confirmation', async () => {
    const user = userEvent.setup();
    const todoLane = makeLane('Todo', 0);
    const reviewLane = makeLane('Review', 1);
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (url === `/api/lanes/${todoLane._id}` && method === 'DELETE') {
        return jsonResponse({
          ok: true,
          data: { _id: todoLane._id },
        });
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });

    render(<Board initialLanes={[todoLane, reviewLane]} />);

    await user.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Todo' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument();
  });

  it('shows a clear error when delete is blocked by server rules', async () => {
    const user = userEvent.setup();
    const todoLaneId = new ObjectId().toString();
    const todoLane: LaneWithCards = {
      _id: todoLaneId,
      title: 'Todo',
      order: 0,
      createdAt: new Date('2026-05-13T00:00:00Z'),
      cards: [
        {
          _id: new ObjectId().toString(),
          laneId: todoLaneId,
          title: 'Existing card',
          order: 0,
          createdAt: new Date('2026-05-13T00:00:00Z'),
          updatedAt: new Date('2026-05-13T00:00:00Z'),
        },
      ],
    };
    const reviewLane = makeLane('Review', 1);
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (url === `/api/lanes/${todoLane._id}` && method === 'DELETE') {
        return jsonResponse(
          {
            ok: false,
            error: 'Lane cannot be deleted because it still contains cards',
          },
          409
        );
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });

    render(<Board initialLanes={[todoLane, reviewLane]} />);

    await user.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);

    await screen.findByText('Lane cannot be deleted because it still contains cards');
    expect(screen.getByRole('heading', { name: 'Todo' })).toBeInTheDocument();
  });

  it('reorders lanes and refreshes the board after a successful move', async () => {
    const user = userEvent.setup();
    const todoLane = makeLane('Todo', 0);
    const reviewLane = makeLane('Review', 1);
    const doneLane = makeLane('Done', 2);
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (url === `/api/lanes/${todoLane._id}/move` && method === 'PATCH') {
        return jsonResponse(
          {
            ok: true,
            data: {
              _id: todoLane._id,
              title: 'Todo',
              order: 1,
              createdAt: '2026-05-13T00:00:00.000Z',
            },
          },
          200
        );
      }

      if (url === '/api/lanes' && method === 'GET') {
        return jsonResponse({
          ok: true,
          data: [reviewLane, { ...todoLane, order: 1 }, doneLane],
        });
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });

    render(<Board initialLanes={[todoLane, reviewLane, doneLane]} />);

    await user.click(
      screen.getByRole('button', { name: new RegExp(`move lane ${todoLane.title} right`, 'i') })
    );

    await waitFor(() => {
      const laneTitles = screen
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent);

      expect(laneTitles).toEqual(['Review', 'Todo', 'Done']);
    });
  });

});
