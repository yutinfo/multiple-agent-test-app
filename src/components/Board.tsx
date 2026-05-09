'use client';

import { LaneWithCards, Card } from '@/types';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState, useCallback } from 'react';
import Lane from './Lane';

interface BoardProps {
  initialLanes: LaneWithCards[];
}

export default function Board({ initialLanes }: BoardProps) {
  const [lanes, setLanes] = useState<LaneWithCards[]>(initialLanes);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    setLanes((prevLanes) => {
      const newLanes = prevLanes.map((lane) => ({ ...lane, cards: [...lane.cards] }));

      // Find source and target lanes
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

      // Find target position
      let targetLaneIndex = -1;
      let targetCardIndex = -1;

      for (let i = 0; i < newLanes.length; i++) {
        const cardIndex = newLanes[i].cards.findIndex((card) => card._id === overId);
        if (cardIndex !== -1) {
          targetLaneIndex = i;
          targetCardIndex = cardIndex;
          break;
        }
        // Also check if we're dropping on a lane itself (when it's empty or over the lane area)
        if (newLanes[i]._id === overId) {
          targetLaneIndex = i;
          targetCardIndex = newLanes[i].cards.length;
          break;
        }
      }

      if (targetLaneIndex === -1) return prevLanes;

      // Remove from source
      newLanes[sourceLaneIndex].cards.splice(sourceCardIndex, 1);

      // Add to target
      newLanes[targetLaneIndex].cards.splice(targetCardIndex, 0, sourceCard);

      return newLanes;
    });
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;

    // Find the card and its new position
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

    // Only call API if the card actually moved
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to move card');
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Failed to move card');
      }

      // Card moved successfully, UI already updated via optimistic update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move card');
      // Revert UI by refetching lanes
      try {
        const response = await fetch('/api/lanes');
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.data) {
            setLanes(data.data);
          }
        }
      } catch {
        // Keep the error state
      }
    }
  }, [lanes]);

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

  return (
    <>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
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
            <Lane
              key={lane._id}
              lane={lane}
              onCardCreated={handleCardCreated}
              onCardDeleted={handleCardDeleted}
              onCardUpdated={handleCardUpdated}
            />
          ))}
        </div>
      </DndContext>
    </>
  );
}
