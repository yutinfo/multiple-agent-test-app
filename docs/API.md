# Kanban Board REST API Specification

## Overview

This document defines the REST API contracts for the Kanban Board MVP. All endpoints follow the common response shape: `{ ok: boolean, data?, error? }`.

**Base URL:** `http://localhost:3000`

---

## Common Response Shape

All API responses follow this shape:

```ts
{
  ok: boolean;           // true if successful, false if error
  data?: T;              // Response payload (omitted if error)
  error?: string;        // Error message (omitted if successful)
}
```

---

## Endpoints

### GET /api/lanes

Retrieve all lanes with their associated cards.

**Request:**
```http
GET /api/lanes
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "data": [
    {
      "_id": "lane-001",
      "title": "Todo",
      "order": 0,
      "createdAt": "2026-05-09T10:00:00Z",
      "cards": [
        {
          "_id": "card-001",
          "laneId": "lane-001",
          "title": "Implement authentication",
          "description": "Add JWT-based auth to backend",
          "order": 0,
          "createdAt": "2026-05-09T10:05:00Z",
          "updatedAt": "2026-05-09T10:05:00Z"
        },
        {
          "_id": "card-002",
          "laneId": "lane-001",
          "title": "Design database schema",
          "order": 1,
          "createdAt": "2026-05-09T10:10:00Z",
          "updatedAt": "2026-05-09T10:10:00Z"
        }
      ]
    },
    {
      "_id": "lane-002",
      "title": "In Progress",
      "order": 1,
      "createdAt": "2026-05-09T10:00:00Z",
      "cards": []
    },
    {
      "_id": "lane-003",
      "title": "Done",
      "order": 2,
      "createdAt": "2026-05-09T10:00:00Z",
      "cards": []
    }
  ]
}
```

**Error Response:** `500 Internal Server Error`
```json
{
  "ok": false,
  "error": "Failed to retrieve lanes"
}
```

---

### POST /api/lanes

Create a new lane at the end of the board.

**Request:**
```http
POST /api/lanes
Content-Type: application/json

{
  "title": "Review"
}
```

**Parameters:**
- `title` (string, required): Lane title. It is trimmed before validation.

**Response:** `201 Created`
```json
{
  "ok": true,
  "data": {
    "_id": "lane-004",
    "title": "Review",
    "order": 3,
    "createdAt": "2026-05-13T12:00:00Z"
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "ok": false,
  "error": "Lane title is required"
}
```

**Error Response:** `409 Conflict`
```json
{
  "ok": false,
  "error": "Lane title already exists"
}
```

---

### DELETE /api/lanes/:id

Delete an empty lane and renumber the remaining lanes so `order` stays continuous.

**Request:**
```http
DELETE /api/lanes/lane-004
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "data": {
    "_id": "lane-004"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "ok": false,
  "error": "Lane not found"
}
```

**Error Response:** `409 Conflict`
```json
{
  "ok": false,
  "error": "Lane cannot be deleted because it still contains cards"
}
```

**Error Response:** `409 Conflict`
```json
{
  "ok": false,
  "error": "At least one lane must remain"
}
```

---

### PATCH /api/lanes/:id/move

Reorder a lane to a new position on the board without changing any cards.

**Request:**
```http
PATCH /api/lanes/lane-004/move
Content-Type: application/json

{
  "targetOrder": 1
}
```

**Parameters:**
- `targetOrder` (integer, required): The final 0-based position for the lane after reorder.

**Behavior Notes:**
- The lane identified by `:id` is moved to `targetOrder`.
- Remaining lanes are renumbered so `order` stays continuous from `0` to `n-1`.
- Cards in every lane are left untouched. Their `laneId` and `order` values do not change.
- If the lane is already at `targetOrder`, the request is treated as a no-op and still returns success.
- This endpoint does not define a `409 Conflict` case. Clients should refetch if they suspect stale UI state.
- Invalid or missing `targetOrder` values return `400 Bad Request`.

**Response:** `200 OK`
```json
{
  "ok": true,
  "data": {
    "_id": "lane-004",
    "title": "Review",
    "order": 1,
    "createdAt": "2026-05-13T12:00:00Z"
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "ok": false,
  "error": "Invalid targetOrder: order out of bounds"
}
```

**Error Response:** `404 Not Found`
```json
{
  "ok": false,
  "error": "Lane not found"
}
```

---

### POST /api/cards

Create a new card in a specified lane.

**Request:**
```http
POST /api/cards
Content-Type: application/json

{
  "laneId": "lane-001",
  "title": "Fix login bug",
  "description": "Users cannot reset password via email"
}
```

**Parameters:**
- `laneId` (string, required): The ID of the lane to add the card to
- `title` (string, required): Card title
- `description` (string, optional): Card description

**Response:** `201 Created`
```json
{
  "ok": true,
  "data": {
    "_id": "card-003",
    "laneId": "lane-001",
    "title": "Fix login bug",
    "description": "Users cannot reset password via email",
    "order": 2,
    "createdAt": "2026-05-09T11:00:00Z",
    "updatedAt": "2026-05-09T11:00:00Z"
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "ok": false,
  "error": "Missing required field: title"
}
```

**Error Response:** `404 Not Found`
```json
{
  "ok": false,
  "error": "Lane not found"
}
```

---

### PATCH /api/cards/:id

Update a card's title or description.

**Request:**
```http
PATCH /api/cards/card-001
Content-Type: application/json

{
  "title": "Implement OAuth authentication",
  "description": "Support Google and GitHub login"
}
```

**Parameters:**
- `title` (string, optional): New card title
- `description` (string, optional): New card description

**Response:** `200 OK`
```json
{
  "ok": true,
  "data": {
    "_id": "card-001",
    "laneId": "lane-001",
    "title": "Implement OAuth authentication",
    "description": "Support Google and GitHub login",
    "order": 0,
    "createdAt": "2026-05-09T10:05:00Z",
    "updatedAt": "2026-05-09T11:30:00Z"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "ok": false,
  "error": "Card not found"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "ok": false,
  "error": "At least one field (title or description) must be provided"
}
```

---

### DELETE /api/cards/:id

Delete a card from a lane.

**Request:**
```http
DELETE /api/cards/card-001
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "data": {
    "_id": "card-001"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "ok": false,
  "error": "Card not found"
}
```

---

### PATCH /api/cards/:id/move

Move a card to a different lane and/or reorder it within the same lane. **This endpoint is critical for drag-and-drop functionality.**

**Request:**
```http
PATCH /api/cards/card-001/move
Content-Type: application/json

{
  "targetLaneId": "lane-002",
  "targetOrder": 0
}
```

**Parameters:**
- `targetLaneId` (string, required): The ID of the lane to move the card to
- `targetOrder` (number, required): The 0-based position in the target lane

**Response:** `200 OK`
```json
{
  "ok": true,
  "data": {
    "_id": "card-001",
    "laneId": "lane-002",
    "title": "Implement OAuth authentication",
    "description": "Support Google and GitHub login",
    "order": 0,
    "createdAt": "2026-05-09T10:05:00Z",
    "updatedAt": "2026-05-09T12:00:00Z"
  }
}
```

**Behavior Notes:**
- When a card is moved to a new lane, it is inserted at `targetOrder` position
- When inserting at `targetOrder`, all existing cards at that position and after are incremented
- When removing from the source lane, all cards after the removed position are decremented
- The `laneId` is updated to reflect the new lane
- `updatedAt` is updated to the current timestamp

**Example: Drag card-002 from lane-001 to position 1 in lane-002**

Source state (lane-001):
```
order 0: card-001
order 1: card-002
order 2: card-003
```

Target state (lane-002):
```
order 0: card-004
order 1: card-002  (moved here)
order 2: card-005
```

Request:
```json
{
  "targetLaneId": "lane-002",
  "targetOrder": 1
}
```

**Error Response:** `404 Not Found`
```json
{
  "ok": false,
  "error": "Card not found"
}
```

**Error Response:** `404 Not Found`
```json
{
  "ok": false,
  "error": "Target lane not found"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "ok": false,
  "error": "Invalid targetOrder: order out of bounds"
}
```

---

## HTTP Status Codes

- `200 OK`: Successful GET, PATCH, or DELETE request
- `201 Created`: Successful POST request (resource created)
- `400 Bad Request`: Invalid request (missing/invalid fields, validation error)
- `404 Not Found`: Resource not found (lane or card)
- `409 Conflict`: Business-rule violation (duplicate lane title, non-empty lane delete, last lane delete)
- `500 Internal Server Error`: Server-side error
- `PATCH /api/lanes/:id/move` uses only `200`, `400`, and `404` in this MVP contract

---

## Data Types

### Lane

```ts
{
  _id: string;              // Unique identifier (MongoDB ObjectId as string)
  title: string;            // Lane name (e.g., "Todo", "In Progress", "Done")
  order: number;            // Display order (0, 1, 2, ...)
  createdAt: Date;          // Creation timestamp
}
```

### Card

```ts
{
  _id: string;              // Unique identifier (MongoDB ObjectId as string)
  laneId: string;           // Reference to parent lane (_id)
  title: string;            // Card title
  description?: string;     // Optional card description
  order: number;            // Display order within the lane (0, 1, 2, ...)
  createdAt: Date;          // Creation timestamp
  updatedAt: Date;          // Last update timestamp
}
```

---

## Default Lanes

When the database is seeded, 3 starter lanes are created in this order:

1. **Todo** (order: 0)
2. **In Progress** (order: 1)
3. **Done** (order: 2)

The board supports creating, deleting, and reordering lanes at runtime, so the live lane count and order are dynamic after startup.

---

## Notes

- All timestamps are ISO 8601 format
- Card order within a lane is managed by the `order` field
- When reordering cards, the backend must maintain correct `order` values
- Reordering a lane must not change any cards in that lane
- The move endpoint handles both lane changes and reordering in a single operation
- No authentication is required for this MVP
