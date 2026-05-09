import { MongoClient, ObjectId } from 'mongodb';

async function seed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kanban';
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db();

    console.log('Clearing existing data...');
    await db.collection('lanes').deleteMany({});
    await db.collection('cards').deleteMany({});

    console.log('Creating lanes...');
    const lanesResult = await db.collection('lanes').insertMany([
      {
        title: 'Todo',
        order: 0,
        createdAt: new Date(),
      },
      {
        title: 'In Progress',
        order: 1,
        createdAt: new Date(),
      },
      {
        title: 'Done',
        order: 2,
        createdAt: new Date(),
      },
    ]);

    const [todoLaneId, inProgressLaneId, doneLaneId] = Object.values(lanesResult.insertedIds);

    console.log('Creating cards...');
    await db.collection('cards').insertMany([
      // Todo lane
      {
        laneId: todoLaneId.toString(),
        title: 'Set up project structure',
        description: 'Initialize Next.js project with TypeScript and MongoDB',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        laneId: todoLaneId.toString(),
        title: 'Design database schema',
        description: 'Create MongoDB collections for lanes and cards',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        laneId: todoLaneId.toString(),
        title: 'Implement drag and drop',
        description: 'Integrate dnd-kit for Kanban board functionality',
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // In Progress lane
      {
        laneId: inProgressLaneId.toString(),
        title: 'Set up API routes',
        description: 'Create REST endpoints for lanes and cards',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        laneId: inProgressLaneId.toString(),
        title: 'Connect to MongoDB',
        description: 'Implement MongoDB singleton client',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Done lane
      {
        laneId: doneLaneId.toString(),
        title: 'Create type definitions',
        description: 'Define TypeScript types for Lane, Card, and API responses',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        laneId: doneLaneId.toString(),
        title: 'Write API documentation',
        description: 'Document all endpoints and their request/response formats',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
