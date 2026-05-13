---
name: Kanban Board Skill
description: Multi-agent workflow for building and maintaining a Kanban board application with Next.js, MongoDB, and drag-and-drop functionality
model: sonnet
---

# Kanban Board Skill

A comprehensive multi-agent skill for developing and maintaining a Kanban board MVP with full CRUD functionality, drag-and-drop support, and containerized deployment.

## Purpose

This skill provides a structured workflow for:
- Setting up a modern Kanban board application
- Managing tasks across three lanes (Todo, In Progress, Done)
- Building with Next.js 15 + React 19 + MongoDB
- Implementing drag-and-drop functionality using @dnd-kit
- Containerizing with Docker for easy deployment
- Using a multi-agent approach with specialized roles

## System Architecture

### Tech Stack

| Layer | Technologies |
|-------|---|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **Drag & Drop** | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities |
| **Backend** | Next.js Route Handlers |
| **Database** | MongoDB (native driver) |
| **Containerization** | Docker, Docker Compose |
| **Package Manager** | pnpm |

### Multi-Agent Roles

The project uses **6 specialized Claude agents** (all running on Haiku model for speed):

1. **Architect** (`.claude/agents/architect.md`)
   - Designs database schema
   - Creates TypeScript type definitions
   - Documents API contracts

2. **Backend Developer** (`.claude/agents/backend-dev.md`)
   - Implements API routes
   - Sets up MongoDB connection
   - Creates database seeding scripts

3. **Frontend Developer** (`.claude/agents/frontend-dev.md`)
   - Builds React components
   - Implements drag-and-drop UI
   - Handles responsive design with Tailwind CSS

4. **DevOps Engineer** (`.claude/agents/devops.md`)
   - Creates Dockerfile configuration
   - Sets up Docker Compose orchestration
   - Manages containerized environments

5. **Code Reviewer** (`.claude/agents/reviewer.md`)
   - Performs code quality reviews
   - Validates implementation against specifications
   - Ensures best practices

6. **QA Engineer** (`.claude/agents/qa.md`)
   - Writes unit tests for API routes
   - Writes component tests for React UI
   - Creates integration tests for critical flows
   - Verifies test coverage >80%

## Quick Start

### Prerequisites
```bash
Node.js 18+
pnpm or npm
MongoDB 7.0+ (or Docker)
Docker & Docker Compose (for containerized setup)
```

### Development Environment

```bash
# Install dependencies
pnpm install

# Seed database with default lanes and sample cards
pnpm seed

# Run development server
pnpm dev

# Open browser to http://localhost:3000
```

### Docker Deployment

```bash
# Build and start all services
docker compose up --build

# Stop services
docker compose down

# Remove MongoDB data
docker compose down -v
```

## Project Structure

```
.claude/agents/
├── architect.md          # Schema & API design
├── backend-dev.md        # API implementation
├── frontend-dev.md       # UI components
├── devops.md            # Docker configuration
├── reviewer.md          # Quality assurance
└── qa.md                # Unit & integration tests

src/
├── app/
│   ├── page.tsx                 # Main board page
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── lanes/route.ts           # Get all lanes
│       └── cards/
│           ├── route.ts             # Create/read cards
│           └── [id]/
│               ├── route.ts         # Update/delete cards
│               └── move/route.ts    # Move between lanes
├── components/
│   ├── Board.tsx          # Main board container
│   ├── Lane.tsx          # Individual lane component
│   ├── Card.tsx          # Card component with edit
│   ├── NewCardForm.tsx   # Card creation form
│   └── CardModal.tsx     # Card edit modal
├── lib/
│   └── mongodb.ts        # Database connection
└── types/
    └── index.ts          # TypeScript definitions

docs/
├── API.md               # API specification

scripts/
└── seed.ts              # Database seeding script
```

## Key Features

### Board Management
- ✅ Three default lanes: Todo, In Progress, Done
- ✅ Full CRUD operations on cards
- ✅ Edit card title and description
- ✅ Drag and drop cards between lanes
- ✅ Reorder cards within a lane
- ✅ Responsive UI design
- ✅ Data persistence in MongoDB

### API Endpoints

All endpoints located in `src/app/api/`:

```typescript
// Lanes
GET    /api/lanes              # Get all lanes with cards

// Cards
POST   /api/cards              # Create new card
GET    /api/cards              # List all cards
PATCH  /api/cards/:id          # Update card (title/description)
DELETE /api/cards/:id          # Delete card
PATCH  /api/cards/:id/move     # Move card to another lane
```

## Database Schema

### Lane Collection

```typescript
{
  _id: ObjectId,
  title: string,              // "Todo", "In Progress", "Done"
  order: number,              // Display order (0, 1, 2)
  createdAt: Date
}
```

### Card Collection

```typescript
{
  _id: ObjectId,
  laneId: ObjectId,           // Reference to parent lane
  title: string,              // Card title
  description?: string,       // Optional description
  order: number,              // Order within lane
  createdAt: Date,
  updatedAt: Date
}
```

## Type Definitions

All types are defined in `src/types/index.ts`:

```typescript
type Lane = {
  _id: ObjectId;
  title: string;
  order: number;
  createdAt: Date;
};

type Card = {
  _id: ObjectId;
  laneId: ObjectId;
  title: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

type Board = {
  lanes: Lane[];
  cards: Map<string, Card[]>;  // Grouped by laneId
};
```

## Workflow Guidelines

### For Developers

1. **Type Safety**
   - Always import types from `src/types/index.ts`
   - Use TypeScript strict mode
   - No `any` types without justification

2. **Database**
   - Use MongoDB native driver (no Mongoose)
   - Reference MongoDB connection in `src/lib/mongodb.ts`
   - Always include proper error handling

3. **Component Development**
   - Keep components in `src/components/`
   - Use Tailwind CSS for styling
   - Follow React 19 best practices
   - Implement proper accessibility

4. **API Development**
   - Create route handlers in `src/app/api/`
   - Use Next.js conventions
   - Validate input before database operations
   - Return proper HTTP status codes

5. **Testing**
   - Run `pnpm seed` to populate test data
   - Test CRUD operations manually
   - Verify drag-and-drop functionality
   - Test data persistence after browser refresh

### For Using Multi-Agents

The agents work best in a **sequential workflow** with clear dependencies:

```
Architect → Backend-Dev → Frontend-Dev → DevOps → Reviewer → QA
```

Each agent:
1. Reads context from previous agent's work
2. Completes their specific task
3. Hands off to next agent

Example workflow:
```bash
# 1. Architect designs the schema & API
# Request: "Update the Card schema to add priority field"
# → Updates src/types/index.ts and docs/API.md

# 2. Backend-Dev implements the API
# Request: "Implement the new Card endpoints with priority support"
# → Updates API routes in src/app/api/

# 3. Frontend-Dev builds the UI
# Request: "Add priority field to Card component and form"
# → Updates components and styling

# 4. DevOps ensures Docker works
# Request: "Update Docker config if needed"
# → Verifies Dockerfile and docker-compose.yml

# 5. Reviewer checks code quality
# Request: "Review all changes for quality and best practices"
# → Validates types, API contracts, security

# 6. QA writes tests
# Request: "Write unit and integration tests for priority feature"
# → Creates comprehensive test coverage
```

## Common Tasks

### Add a New Card

```bash
# Via UI
1. Click "Add Card" button in desired lane
2. Enter title and description
3. Click "Create"

# Via API
curl -X POST http://localhost:3000/api/cards \
  -H "Content-Type: application/json" \
  -d '{
    "laneId": "<lane_id>",
    "title": "New Task",
    "description": "Task description",
    "order": 0
  }'
```

### Move a Card

```bash
# Via UI
1. Click and drag card to another lane
2. Release to drop

# Via API
curl -X PATCH http://localhost:3000/api/cards/<card_id>/move \
  -H "Content-Type: application/json" \
  -d '{
    "laneId": "<new_lane_id>",
    "order": 0
  }'
```

### Deploy with Docker

```bash
# One-step deployment
docker compose up --build

# Access at http://localhost:3000
# MongoDB runs on mongodb://mongo:27017 (internal)
# Node app runs on port 3000
```

## Known Limitations

⚠️ This is an MVP. Future enhancements could include:
- User authentication and authorization
- Real-time synchronization across clients
- User-specific boards
- Advanced permissions and roles
- Board templates
- Card attachments and comments
- Activity audit logs

## Troubleshooting

### MongoDB Connection Error
```bash
# Ensure MongoDB is running
# Local: mongodb://localhost:27017
# Docker: mongodb://mongo:27017

# Check connection in .env.local
MONGODB_URI=mongodb://localhost:27017
```

### Port 3000 Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in next.config.ts
```

### Drag and Drop Not Working
- Ensure @dnd-kit is properly installed
- Check browser console for errors
- Verify component hierarchy in Board/Lane/Card

### Data Not Persisting
- Verify MongoDB is connected
- Check database name in connection string
- Ensure seed script ran successfully

## Best Practices

1. **Keep Components Small**
   - Each component should have a single responsibility
   - Use composition over inheritance

2. **Error Handling**
   - Always wrap API calls in try-catch
   - Provide user-friendly error messages
   - Log errors for debugging

3. **Performance**
   - Use React.memo for expensive components
   - Implement proper loading states
   - Optimize MongoDB queries with indexes

4. **Code Quality**
   - Run `pnpm lint` before committing
   - Follow Prettier formatting
   - Write meaningful commit messages

5. **Documentation**
   - Keep README updated
   - Document API changes in docs/API.md
   - Add comments for complex logic

## Environment Variables

Create `.env.local` in project root:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/kanban-board

# Node Environment
NODE_ENV=development

# Port (optional, defaults to 3000)
PORT=3000
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [MongoDB Node Driver](https://www.mongodb.com/docs/drivers/node/)
- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [Tailwind CSS](https://tailwindcss.com)
- [Docker Documentation](https://docs.docker.com)

## Support

For issues or questions:
1. Check this SKILL.md documentation
2. Review relevant agent file in `.claude/agents/`
3. Check project README.md
4. Review API documentation in `docs/API.md`
5. Check console logs for error details

---

**Built with Claude Code's multi-agent system** 🤖

*Last Updated: 2026-05-13*
