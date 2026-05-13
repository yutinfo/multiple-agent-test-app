'use client';

import { Card } from '@/types';
import { useState, useTransition } from 'react';

interface NewCardFormProps {
  laneId: string;
  onCardCreated: (card: Card) => void;
  onCancel: () => void;
}

export default function NewCardForm({
  laneId,
  onCardCreated,
  onCancel,
}: NewCardFormProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please enter a card title');
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            laneId,
            title: title.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Failed to create card');
        }

        onCardCreated(data.data);
        setTitle('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create card');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Card title..."
        disabled={isPending}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:opacity-50"
        autoFocus
      />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-500 text-white text-sm font-medium rounded transition-colors"
        >
          {isPending ? 'Adding...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-600 hover:text-gray-700 text-sm font-medium rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
