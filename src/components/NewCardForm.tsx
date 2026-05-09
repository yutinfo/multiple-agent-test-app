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
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        autoFocus
      />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white text-sm font-medium rounded transition-colors"
        >
          {isPending ? 'Adding...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 text-sm font-medium rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
