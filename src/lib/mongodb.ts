import { MongoClient, Db } from 'mongodb';

// Cache for the MongoDB client singleton
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Get a connected MongoDB client using singleton pattern
 * Caches the client globally to avoid reconnecting on every request
 */
export async function getDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kanban';

  if (!cachedClient) {
    cachedClient = new MongoClient(mongoUri);
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db();
  return cachedDb;
}
