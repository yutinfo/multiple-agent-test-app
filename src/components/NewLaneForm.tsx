'use client';

import { useState, useTransition } from 'react';

interface NewLaneFormProps {
  onLaneCreated: (title: string) => Promise<void>;
  onCancel: () => void;
}

export default function NewLaneForm({
  onLaneCreated,
  onCancel,
}: NewLaneFormProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a lane title');
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        await onLaneCreated(trimmedTitle);
        setTitle('');
        onCancel();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create lane');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">
          Lane title
        </label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter lane title..."
          disabled={isPending}
          autoFocus
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-600 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 disabled:opacity-50"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-teal-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-teal-500/70"
        >
          {isPending ? 'Adding...' : 'Add Lane'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:text-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
