import { ObjectId } from 'mongodb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import type { ComponentProps } from 'react';
import Lane from './Lane';
import { LaneWithCards } from '@/types';

function makeLane(overrides: Partial<LaneWithCards> = {}): LaneWithCards {
  const laneId = new ObjectId().toString();

  return {
    _id: laneId,
    title: 'Todo',
    order: 0,
    createdAt: new Date('2026-05-13T00:00:00Z'),
    cards: [
      {
        _id: new ObjectId().toString(),
        laneId,
        title: 'First card',
        description: 'First description',
        order: 0,
        createdAt: new Date('2026-05-13T00:00:00Z'),
        updatedAt: new Date('2026-05-13T00:00:00Z'),
      },
      {
        _id: new ObjectId().toString(),
        laneId,
        title: 'Second card',
        description: 'Second description',
        order: 1,
        createdAt: new Date('2026-05-13T00:00:00Z'),
        updatedAt: new Date('2026-05-13T00:00:00Z'),
      },
    ],
    ...overrides,
  };
}

function renderLane(lane: LaneWithCards, overrides: Partial<ComponentProps<typeof Lane>> = {}) {
  const props: ComponentProps<typeof Lane> = {
    lane,
    onCardCreated: vi.fn(),
    onCardDeleted: vi.fn(),
    onCardUpdated: vi.fn(),
    onDeleteLane: vi.fn(),
    onMoveLane: vi.fn(),
    canDelete: true,
    canMoveLeft: true,
    canMoveRight: true,
    isLaneMovePending: false,
    isMovingLane: false,
    ...overrides,
  };

  return render(
    <DndContext>
      <Lane {...props} />
    </DndContext>
  );
}

describe('Lane', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders cards in order and shows lane move controls', () => {
    const lane = makeLane();
    renderLane(lane, {
      canMoveLeft: false,
      canMoveRight: true,
    });

    expect(screen.getByRole('heading', { name: 'Todo' })).toBeInTheDocument();
    expect(screen.getByText('2 card(s)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /move lane todo left/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /move lane todo right/i })).toBeEnabled();

    const cardTitles = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
    expect(cardTitles).toEqual(['First card', 'Second card']);
  });

  it('calls the move handler with the next target order', async () => {
    const user = userEvent.setup();
    const lane = makeLane();
    const onMoveLane = vi.fn();

    renderLane(lane, {
      onMoveLane,
    });

    await user.click(screen.getByRole('button', { name: /move lane todo right/i }));

    expect(onMoveLane).toHaveBeenCalledWith(lane._id, 1);
  });

  it('shows pending state and disables move controls while a lane move is in flight', () => {
    const lane = makeLane();

    renderLane(lane, {
      canMoveLeft: true,
      canMoveRight: true,
      isLaneMovePending: true,
      isMovingLane: true,
    });

    expect(screen.getByText('Moving lane...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /move lane todo left/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /move lane todo right/i })).toBeDisabled();
  });
});
