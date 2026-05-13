'use client';

import { Card } from '@/types';
import { useState, useTransition } from 'react';

interface CardModalProps {
  card: Card;
  onClose: () => void;
  onCardUpdated: (card: Card) => void;
  onCardDeleted: (cardId: string) => void;
}

export default function CardModal({
  card,
  onClose,
  onCardUpdated,
  onCardDeleted,
}: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!title.trim()) {
      setError('Card title cannot be empty');
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch(`/api/cards/${card._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Failed to update card');
        }

        onCardUpdated(data.data);
        setIsEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update card');
      }
    });
  };

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this card?')) {
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch(`/api/cards/${card._id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Failed to delete card');
        }

        onCardDeleted(card._id);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete card');
      }
    });
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-soft-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-soft-white">
            <h2 className="text-xl font-bold text-gray-900">Card Details</h2>
            <button
              onClick={onClose}
              className="text-teal-600 hover:text-teal-700 text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {isEditing ? (
              <>
                {/* Edit Mode */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isPending}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isPending}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:opacity-50"
                    placeholder="Optional description..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-500 text-white font-medium rounded-lg transition-colors"
                  >
                    {isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setTitle(card.title);
                      setDescription(card.description || '');
                      setIsEditing(false);
                      setError(null);
                    }}
                    disabled={isPending}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-600 hover:text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* View Mode */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Title</h3>
                  <p className="text-gray-900 break-words">{card.title}</p>
                </div>

                {card.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Description</h3>
                    <p className="text-gray-600 break-words whitespace-pre-wrap">
                      {card.description}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-600 space-y-1 pt-2">
                  <p>Created: {new Date(card.createdAt).toLocaleString()}</p>
                  <p>Updated: {new Date(card.updatedAt).toLocaleString()}</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
                  >
                    {isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
