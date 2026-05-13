import { GetLanesResponse } from '@/types';
import Board from '@/components/Board';

export const dynamic = 'force-dynamic';

async function getLanes(): Promise<GetLanesResponse> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/lanes`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch lanes');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching lanes:', error);
    throw error;
  }
}

export default async function HomePage() {
  let lanesData;
  let error = null;

  try {
    const response = await getLanes();
    if (response.ok && response.data) {
      lanesData = response.data;
    } else {
      error = response.error || 'Failed to load board';
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'An error occurred while loading the board';
  }

  return (
    <main className="min-h-screen bg-soft-white">
      {error ? (
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-red-700">
            <p className="font-semibold">Error loading board</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      ) : lanesData ? (
        <Board initialLanes={lanesData} />
      ) : (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500" />
            <p className="text-gray-600">Loading board...</p>
          </div>
        </div>
      )}
    </main>
  );
}
