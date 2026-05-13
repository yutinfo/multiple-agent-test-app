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
}

export default function Lane({
  lane,
  onCardCreated,
  onCardDeleted,
  onCardUpdated,
}: LaneProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);

  const { setNodeRef } = useDroppable({
    id: lane._id,
  });

  return (
    <>
      <div
        ref={setNodeRef}
        className="flex-shrink-0 w-80 bg-white border border-gray-200 rounded-lg shadow-md p-4 hover:border-teal-200 transition-colors"
      >
        {/* Lane Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{lane.title}</h2>
            <p className="text-sm text-gray-600">{lane.cards.length} card(s)</p>
          </div>
        </div>

        {/* Cards Container */}
        <SortableContext items={lane.cards.map((c) => c._id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mb-4 min-h-[400px]">
            {lane.cards.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
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

        {/* Add Card Button/Form */}
        {!showNewCardForm ? (
          <button
            onClick={() => setShowNewCardForm(true)}
            className="w-full px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded transition-colors"
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

      {/* Card Modal */}
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
