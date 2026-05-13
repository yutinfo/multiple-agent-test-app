'use client';

import { LaneWithCards, Card } from '@/types';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import CardComponent from './Card';
import NewCardForm from './NewCardForm';
import CardModal from './CardModal';

interface LaneProps {
  lane: LaneWithCards;
  onCardCreated: (card: Card) => void;
  onCardDeleted: (cardId: string) => void;
  onCardUpdated: (card: Card) => void;
  onDeleteLane: (laneId: string) => Promise<void>;
  onMoveLane: (laneId: string, targetOrder: number) => Promise<void>;
  canDelete: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  isLaneMovePending: boolean;
  isMovingLane: boolean;
}

export default function Lane({
  lane,
  onCardCreated,
  onCardDeleted,
  onCardUpdated,
  onDeleteLane,
  onMoveLane,
  canDelete,
  canMoveLeft,
  canMoveRight,
  isLaneMovePending,
  isMovingLane,
}: LaneProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { setNodeRef } = useDroppable({
    id: lane._id,
  });

  const handleDelete = async () => {
    if (!canDelete || isLaneMovePending) {
      return;
    }

    const confirmed = window.confirm(`Delete lane "${lane.title}"?`);
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteLane(lane._id);
    } catch {
      // Board-level error banner already handles the message.
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveLeft = () => {
    void onMoveLane(lane._id, lane.order - 1);
  };

  const handleMoveRight = () => {
    void onMoveLane(lane._id, lane.order + 1);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        className="flex-shrink-0 w-80 rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm transition-colors hover:border-teal-100"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-gray-900">{lane.title}</h2>
            <p className="text-sm text-gray-600">{lane.cards.length} card(s)</p>
            {isMovingLane && (
              <p className="mt-1 text-xs font-medium text-teal-600">Moving lane...</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-full border border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleMoveLeft}
                disabled={!canMoveLeft || isLaneMovePending}
                title={
                  canMoveLeft ? `Move lane ${lane.title} left` : 'This lane is already first'
                }
                aria-label={`Move lane ${lane.title} left`}
                className="px-2.5 py-1 text-sm font-semibold text-gray-700 transition-colors hover:bg-white hover:text-teal-700 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
              >
                {isMovingLane ? 'Moving...' : '<'}
              </button>
              <button
                type="button"
                onClick={handleMoveRight}
                disabled={!canMoveRight || isLaneMovePending}
                title={
                  canMoveRight ? `Move lane ${lane.title} right` : 'This lane is already last'
                }
                aria-label={`Move lane ${lane.title} right`}
                className="border-l border-gray-200 px-2.5 py-1 text-sm font-semibold text-gray-700 transition-colors hover:bg-white hover:text-teal-700 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
              >
                {isMovingLane ? 'Moving...' : '>'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || isDeleting || isLaneMovePending}
              title={
                !canDelete
                  ? 'Keep at least one lane'
                  : isLaneMovePending
                    ? 'Wait for the lane move to finish'
                    : `Delete lane ${lane.title}`
              }
              className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <SortableContext items={lane.cards.map((c) => c._id)} strategy={verticalListSortingStrategy}>
          <div className="mb-4 min-h-[400px] space-y-2">
            {lane.cards.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                No cards yet
              </div>
            ) : (
              lane.cards.map((card) => (
                <CardComponent
                  key={card._id}
                  card={card}
                  onClick={() => setSelectedCard(card)}
                />
              ))
            )}
          </div>
        </SortableContext>

        {!showNewCardForm ? (
          <button
            type="button"
            onClick={() => setShowNewCardForm(true)}
            className="w-full rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-100"
          >
            + Add Card
          </button>
        ) : (
          <NewCardForm
            laneId={lane._id}
            onCardCreated={(card) => {
              onCardCreated(card);
              setShowNewCardForm(false);
            }}
            onCancel={() => setShowNewCardForm(false)}
          />
        )}
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onCardUpdated={(updatedCard) => {
            onCardUpdated(updatedCard);
            setSelectedCard(updatedCard);
          }}
          onCardDeleted={(cardId) => {
            onCardDeleted(cardId);
            setSelectedCard(null);
          }}
        />
      )}
    </>
  );
}
