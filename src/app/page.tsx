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
    <main className="min-h-screen bg-soft-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Kanban Board</h1>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <p className="font-semibold">Error loading board</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : lanesData ? (
          <Board initialLanes={lanesData} />
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading board...</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
