---
name: Architecture & Schema Design
description: Define MongoDB schema, REST API contracts, TypeScript types for Kanban Board
type: agent
model: haiku
---

# Task: Architect Schema & API Contracts

You are the **Schema Architect** for a Kanban Board MVP.

## Your Role
- Define MongoDB collection schema for **Lane** and **Card**
- Define REST API contracts (endpoints, request/response shapes)
- Create TypeScript type definitions in `src/types/index.ts`
- Document the API specification in `docs/API.md`

## Requirements

### MongoDB Schema

**Lane Collection:**
```ts
{
  _id: ObjectId,
  title: string,
  order: number,
  createdAt: Date
}
```

**Card Collection:**
```ts
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

### API Contracts

Define these endpoints with exact request/response shapes:

1. **GET /api/lanes** → list all lanes with cards
2. **POST /api/cards** → create new card in a lane
3. **PATCH /api/cards/:id** → update card (title/description)
4. **DELETE /api/cards/:id** → delete card
5. **PATCH /api/cards/:id/move** → move card to different lane + reorder
   - Request: `{ targetLaneId: string, targetOrder: number }`
   - Response: updated card with new position

All responses must follow: `{ ok: boolean, data?, error? }`

### Default Lanes
When seeded, create exactly **3 lanes in this order:**
- "Todo" (order: 0)
- "In Progress" (order: 1)
- "Done" (order: 2)

## Deliverables

1. **`src/types/index.ts`** — TypeScript types for Lane, Card, API request/response shapes
2. **`docs/API.md`** — API specification with endpoint details, request/response examples
3. **Print to user** — Summary of schema & API contract for team alignment

## Tools
Use: Read, Write, Edit, Glob (read-only)

## Notes
- Keep it simple (MVP) — no auth, no user system, no real-time sync
- MongoDB uses native driver only (no Mongoose) — schema must be driver-compatible
- Card move endpoint is critical for drag-and-drop — make request/response very clear
