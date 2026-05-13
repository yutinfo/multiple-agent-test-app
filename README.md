# Kanban Board MVP

A minimal Kanban board application with drag-and-drop support, built with Next.js, MongoDB, and multi-agent architecture.

## 🎯 Features

- ✅ Seeded lanes with dynamic lane management
- ✅ Create, read, update, delete cards
- ✅ Drag and drop cards between lanes
- ✅ Reorder cards within a lane
- ✅ Edit card title and description
- ✅ Responsive UI with Tailwind CSS

## 🏗️ Multi-Agent Architecture

This project uses **6 Claude Code subagents** (all using Haiku model) in sequential workflow:

| Agent | Role | Output |
|-------|------|--------|
| **architect** | Schema & API contracts | `src/types/index.ts`, `docs/API.md` |
| **backend-dev** | API routes & MongoDB | `src/app/api/*/route.ts`, `src/lib/mongodb.ts`, `scripts/seed.ts` |
| **frontend-dev** | UI components & drag-drop | `src/components/`, `src/app/page.tsx` |
| **devops** | Docker setup | `Dockerfile`, `docker-compose.yml` |
| **reviewer** | Quality gate | Code review reports |
| **qa** | Unit & integration tests | `*.test.ts`, `*.test.tsx`, coverage reports |

**Sequential Workflow:**
```
Architect → Backend-Dev → Frontend-Dev → DevOps → Reviewer → QA
```

**Key Rule:** All subagent files in `.claude/agents/` must have `model: haiku` in frontmatter.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm)
- MongoDB 7.0+ (or Docker)
- Docker & Docker Compose (for containerized setup)

### Development Setup

```bash
# Install dependencies
pnpm install

# Start MongoDB locally (if not using Docker)
# Make sure MongoDB is running on mongodb://localhost:27017

# Seed default lanes and sample cards
pnpm seed

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Setup

```bash
# Build and start all services
docker compose up --build

# The app will be available at http://localhost:3000
# MongoDB is automatically started

# Stop services
docker compose down

# Remove MongoDB data (careful!)
docker compose down -v
```

## 📁 Project Structure

```
.
├── .claude/
│   └── agents/
│       ├── architect.md        → Schema design
│       ├── backend-dev.md      → API implementation
│       ├── frontend-dev.md     → UI components
│       ├── devops.md           → Docker setup
│       └── reviewer.md         → Code review
├── src/
│   ├── app/
│   │   ├── page.tsx            → Main board page
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── lanes/route.ts
│   │       └── cards/
│   │           ├── route.ts
│   │           └── [id]/
│   │               ├── route.ts
│   │               └── move/route.ts
│   ├── components/
│   │   ├── Board.tsx
│   │   ├── Lane.tsx
│   │   ├── Card.tsx
│   │   ├── NewCardForm.tsx
│   │   ├── NewLaneForm.tsx
│   │   └── CardModal.tsx
│   ├── lib/
│   │   └── mongodb.ts
│   └── types/
│       └── index.ts
├── scripts/
│   └── seed.ts                 → Database seeding
├── docs/
│   └── API.md                  → API specification
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🔌 API Endpoints

See `docs/API.md` for detailed specifications.

### Main Endpoints

- `GET /api/lanes` — Get all lanes with cards
- `POST /api/lanes` — Create a lane
- `DELETE /api/lanes/:id` — Delete a lane
- `POST /api/cards` — Create a card
- `PATCH /api/cards/:id` — Update a card
- `DELETE /api/cards/:id` — Delete a card
- `PATCH /api/cards/:id/move` — Move card to another lane

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + TypeScript + React 19 + Tailwind CSS |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Backend | Next.js Route Handlers |
| Database | MongoDB (native driver) |
| Containerization | Docker + Docker Compose |
| Package Manager | pnpm |

## 📊 Database Schema

### Lane Collection
```typescript
{
  _id: ObjectId,
  title: string,
  order: number,
  createdAt: Date
}
```

### Card Collection
```typescript
{
  _id: ObjectId,
  laneId: ObjectId,
  title: string,
  description?: string,
  order: number,
  createdAt: Date,
  updatedAt: Date
}
```

## ✅ Acceptance Criteria

- [x] Project structure initialized
- [ ] Schema & types defined (architect)
- [ ] API routes implemented (backend-dev)
- [ ] API review passed (reviewer)
- [ ] UI components built (frontend-dev)
- [ ] Frontend review passed (reviewer)
- [ ] Docker setup complete (devops)
- [ ] Code quality review passed (reviewer)
- [ ] Unit & integration tests written (qa)
- [ ] Test coverage >80% (qa)
- [ ] All tests pass (qa)
- [ ] `docker compose up --build` runs without errors
- [ ] Board loads with the seeded lanes
- [ ] CRUD operations work
- [ ] Drag-and-drop works
- [ ] Data persists after refresh
- [ ] README complete with all instructions

## 🚨 Known Limitations

- **No authentication** — This is an MVP
- **No real-time sync** — Page refresh required for multi-user changes
- **No user system** — Everyone shares the same board
- **No permissions** — Everyone can read/write all cards

## 📝 Notes

### For Developers Working on This Project

1. **Haiku Model Constraint:** All agents in `.claude/agents/` use Haiku for speed and cost. If an agent struggles, **improve the prompt clarity** rather than changing the model.

2. **Sequential Workflow:** Always follow the agent flow in order:
   - **Architect** → defines schema & types
   - **Backend-Dev** → implements API
   - **Frontend-Dev** → builds UI
   - **DevOps** → configures Docker
   - **Reviewer** → validates quality
   - **QA** → writes tests
   
   Each agent reads the previous agent's output and hands off to the next.

3. **Type Safety:** Always import types from `src/types/index.ts`.

4. **Database Operations:** Use MongoDB native driver only—no Mongoose.

5. **Testing:** 
   - Run `pnpm seed` to populate test data before manual testing
   - QA agent creates `*.test.ts` and `*.test.tsx` files
   - Run `pnpm test` to execute all tests

## 🤝 Contributing

This project follows a multi-agent workflow. If modifying:
1. Update the relevant agent file in `.claude/agents/`
2. Let the agent implement the changes
3. Run through the reviewer agent for quality checks
4. Test with `docker compose up --build`

## 📄 License

MIT (or your preferred license)

---

**Built with Claude Code's multi-agent system** 🤖
