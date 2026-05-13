'use client';

import { LaneWithCards, Card, Lane } from '@/types';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useCallback, useRef, useState } from 'react';
import LaneColumn from './Lane';
import NewLaneForm from './NewLaneForm';

interface BoardProps {
  initialLanes: LaneWithCards[];
}

function sortLanesByOrder(lanes: LaneWithCards[]): LaneWithCards[] {
  return [...lanes].sort((a, b) => a.order - b.order);
}

export default function Board({ initialLanes }: BoardProps) {
  const [lanes, setLanes] = useState<LaneWithCards[]>(() => sortLanesByOrder(initialLanes));
  const [error, setError] = useState<string | null>(null);
  const [showNewLaneForm, setShowNewLaneForm] = useState(false);
  const [movingLaneId, setMovingLaneId] = useState<string | null>(null);
  const movingLaneIdRef = useRef<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const refreshLanes = useCallback(async () => {
    const response = await fetch('/api/lanes', {
      cache: 'no-store',
    });

    const data = (await response.json()) as {
      ok: boolean;
      data?: LaneWithCards[];
      error?: string;
    };

    if (!response.ok || !data.ok || !Array.isArray(data.data)) {
      throw new Error(data.error || 'Failed to refresh board');
    }

    setLanes(sortLanesByOrder(data.data));
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    setLanes((prevLanes) => {
      const newLanes = prevLanes.map((lane) => ({ ...lane, cards: [...lane.cards] }));

      let sourceCard = null;
      let sourceLaneIndex = -1;
      let sourceCardIndex = -1;

      for (let i = 0; i < newLanes.length; i++) {
        const cardIndex = newLanes[i].cards.findIndex((card) => card._id === activeId);
        if (cardIndex !== -1) {
          sourceCard = newLanes[i].cards[cardIndex];
          sourceLaneIndex = i;
          sourceCardIndex = cardIndex;
          break;
        }
      }

      if (!sourceCard) return prevLanes;

      let targetLaneIndex = -1;
      let targetCardIndex = -1;

      for (let i = 0; i < newLanes.length; i++) {
        const cardIndex = newLanes[i].cards.findIndex((card) => card._id === overId);
        if (cardIndex !== -1) {
          targetLaneIndex = i;
          targetCardIndex = cardIndex;
          break;
        }

        if (newLanes[i]._id === overId) {
          targetLaneIndex = i;
          targetCardIndex = newLanes[i].cards.length;
          break;
        }
      }

      if (targetLaneIndex === -1) return prevLanes;

      newLanes[sourceLaneIndex].cards.splice(sourceCardIndex, 1);
      newLanes[targetLaneIndex].cards.splice(targetCardIndex, 0, sourceCard);

      return newLanes;
    });
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeId = active.id as string;

      let cardToMove = null;
      let targetLaneId = null;
      let targetOrder = -1;

      for (const lane of lanes) {
        const cardIndex = lane.cards.findIndex((card) => card._id === activeId);
        if (cardIndex !== -1) {
          cardToMove = lane.cards[cardIndex];
          targetLaneId = lane._id;
          targetOrder = cardIndex;
          break;
        }
      }

      if (!cardToMove || !targetLaneId || targetOrder === -1) return;

      if (cardToMove.laneId === targetLaneId && cardToMove.order === targetOrder) {
        return;
      }

      try {
        setError(null);
        const response = await fetch(`/api/cards/${activeId}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetLaneId,
            targetOrder,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Failed to move card');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to move card');

        try {
          const response = await fetch('/api/lanes');
          if (response.ok) {
            const data = await response.json();
            if (data.ok && data.data) {
              setLanes(data.data);
            }
          }
        } catch {
          // Keep the current optimistic state if the refetch also fails.
        }
      }
    },
    [lanes]
  );

  const handleCardCreated = useCallback((newCard: Card) => {
    setLanes((prevLanes) =>
      prevLanes.map((lane) => {
        if (lane._id === newCard.laneId) {
          return {
            ...lane,
            cards: [...lane.cards, newCard],
          };
        }
        return lane;
      })
    );
  }, []);

  const handleCardDeleted = useCallback((cardId: string) => {
    setLanes((prevLanes) =>
      prevLanes.map((lane) => ({
        ...lane,
        cards: lane.cards.filter((card) => card._id !== cardId),
      }))
    );
  }, []);

  const handleCardUpdated = useCallback((updatedCard: Card) => {
    setLanes((prevLanes) =>
      prevLanes.map((lane) => ({
        ...lane,
        cards: lane.cards.map((card) =>
          card._id === updatedCard._id ? updatedCard : card
        ),
      }))
    );
  }, []);

  const handleLaneCreated = useCallback(async (title: string) => {
    setError(null);
    const response = await fetch('/api/lanes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Failed to create lane');
    }

    const createdLane: Lane = data.data;

    setLanes((prevLanes) =>
      sortLanesByOrder([...prevLanes, { ...createdLane, cards: [] }])
    );
  }, []);

  const handleLaneDeleted = useCallback(async (laneId: string) => {
    setError(null);
    const response = await fetch(`/api/lanes/${laneId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      const message = data.error || 'Failed to delete lane';
      setError(message);
      throw new Error(message);
    }

    setLanes((prevLanes) =>
      prevLanes
        .filter((lane) => lane._id !== laneId)
        .map((lane, index) => ({
          ...lane,
          order: index,
        }))
        .sort((a, b) => a.order - b.order)
    );
  }, []);

  const handleLaneMove = useCallback(
    async (laneId: string, targetOrder: number) => {
      if (movingLaneIdRef.current) {
        return;
      }

      setError(null);
      movingLaneIdRef.current = laneId;
      setMovingLaneId(laneId);
      let moveSucceeded = false;

      try {
        const response = await fetch(`/api/lanes/${laneId}/move`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ targetOrder }),
        });

        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
        };

        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Failed to move lane');
        }

        moveSucceeded = true;
        await refreshLanes();
      } catch (err) {
        setError(
          moveSucceeded
            ? 'Lane moved, but failed to refresh board'
            : err instanceof Error
              ? err.message
              : 'Failed to move lane'
        );
      } finally {
        movingLaneIdRef.current = null;
        setMovingLaneId(null);
      }
    },
    [refreshLanes]
  );

  return (
    <div className="min-h-screen bg-soft-white px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Kanban Board</h1>
            <p className="mt-2 text-sm text-gray-600">
              Keep lanes flexible, delete what you no longer need, and protect active work.
            </p>
          </div>

          {!showNewLaneForm && (
            <button
              type="button"
              onClick={() => setShowNewLaneForm(true)}
              className="rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-100"
            >
              + Add Lane
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {showNewLaneForm && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <NewLaneForm
              onLaneCreated={handleLaneCreated}
              onCancel={() => setShowNewLaneForm(false)}
            />
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4">
            {lanes.map((lane) => (
              <LaneColumn
                key={lane._id}
                lane={lane}
                onCardCreated={handleCardCreated}
                onCardDeleted={handleCardDeleted}
                onCardUpdated={handleCardUpdated}
                onDeleteLane={handleLaneDeleted}
                onMoveLane={handleLaneMove}
                canDelete={lanes.length > 1}
                canMoveLeft={lane.order > 0}
                canMoveRight={lane.order < lanes.length - 1}
                isLaneMovePending={movingLaneId !== null}
                isMovingLane={movingLaneId === lane._id}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
