# Lane Management Task Breakdown

## Objective

Add lane management to the Kanban Board so users can:
- create a new lane
- delete an existing lane
- reorder lanes/columns manually
- be blocked from deleting a lane that still contains cards

This plan is designed to use the existing agent structure in `.claude/agents/` as fully as possible while keeping handoff clear.

## Scope

In scope:
- add lane creation
- add lane deletion
- add lane reordering
- add backend validation to prevent deleting non-empty lanes
- update UI for lane actions
- update API contract, types, and tests

Out of scope:
- rename lane
- move all cards before deleting a lane
- permissions and audit log

## Working Assumptions

Use these assumptions unless product decides otherwise:
- default seeded lanes can also be deleted if they are empty
- lane title is required and trimmed
- lane title must be unique, case-insensitive
- new lane is inserted at the end of the board
- lane reorder must persist and keep `order` continuous from `0..n-1`
- lane reorder must not change any cards in that lane
- the system must always keep at least 1 lane
- deleting a non-empty lane returns `409 Conflict`

## Feature Breakdown

### Feature 1: Create Lane

User value:
- users can add a new column to match their workflow

Expected behavior:
- user clicks `Add Lane`
- user enters lane title
- system validates title
- system creates lane with the next available `order`
- new lane appears on the board immediately after success

Acceptance criteria:
- user can create a lane from the board UI
- empty or whitespace-only title is rejected
- duplicate title is rejected
- new lane is added at the end
- lane is persisted after refresh

### Feature 2: Delete Empty Lane

User value:
- users can remove unused columns and keep the board clean

Expected behavior:
- user clicks `Delete Lane`
- system checks whether lane contains cards
- if lane is empty, system asks for confirmation and deletes it
- if lane contains cards, system blocks deletion and shows a clear message

Acceptance criteria:
- empty lane can be deleted
- non-empty lane cannot be deleted
- lanes are re-ordered after deletion so `order` remains continuous
- board updates correctly after refresh

### Feature 3: Reorder Lane

User value:
- users can organize the board by changing the order of lanes without affecting cards

Expected behavior:
- user drags a lane to a new position or uses a reorder control
- system validates the requested target order
- system renumbers all lanes so `order` remains continuous
- cards inside each lane remain untouched
- new order is persisted and restored after refresh

Acceptance criteria:
- user can reorder lanes from the UI
- invalid target order is rejected with a clear API error
- lane order is continuous after every successful reorder
- cards in reordered lanes remain present and keep their own order
- board state after refresh matches the persisted lane order

## Workflow Design

### Create Lane Flow

1. User clicks `Add Lane`
2. UI opens inline form or modal
3. User enters lane title
4. Frontend validates basic input
5. Frontend calls `POST /api/lanes`
6. Backend validates title and uniqueness
7. Backend writes new lane with `order = max(order) + 1`
8. Backend returns created lane
9. Frontend updates board state and renders new lane

### Delete Lane Flow

1. User clicks lane action menu
2. User selects `Delete Lane`
3. UI asks for confirmation
4. Frontend calls `DELETE /api/lanes/:id`
5. Backend checks whether the lane exists
6. Backend checks whether the lane has cards
7. If lane has cards, backend returns `409`
8. If lane is empty, backend deletes lane and reorders remaining lanes
9. Frontend updates board state or shows blocking error message

### Reorder Lane Flow

1. User drags a lane or chooses a move action
2. UI calculates the target lane position
3. Frontend calls `PATCH /api/lanes/:id/move`
4. Backend validates the lane exists
5. Backend validates `targetOrder`
6. Backend updates lane orders so they stay continuous
7. Backend leaves cards untouched
8. Frontend updates board state immediately or refetches on failure

## Business Rules

- A lane cannot be deleted if it has one or more cards.
- Lane title is required after trim.
- Lane title must be unique regardless of uppercase/lowercase.
- New lane is created at the end of the lane list.
- Remaining lane orders must be normalized after a delete.
- Lane reorder must preserve all cards inside the lane and must not change card order.
- Lane reorder must normalize all lane orders to a continuous `0..n-1` sequence.
- The board must never end up with zero lanes.
- All API responses must keep the existing shape: `{ ok, data?, error? }`.

## Edge Cases

- user submits a title with only spaces
- user submits a title that already exists with different casing
- user tries to delete the last remaining lane
- user tries to delete a lane from stale UI after a card was added there
- create request succeeds in UI but frontend state update fails
- duplicate submit from double click
- lane delete and card create happen nearly at the same time

## Technical Requirements

### API

Add endpoints:
- `POST /api/lanes`
- `DELETE /api/lanes/:id`
- `PATCH /api/lanes/:id/move`

Recommended contract:

`POST /api/lanes`
```json
{
  "title": "Blocked"
}
```

Success:
```json
{
  "ok": true,
  "data": {
    "_id": "lane-004",
    "title": "Blocked",
    "order": 3,
    "createdAt": "2026-05-13T12:00:00Z"
  }
}
```

`DELETE /api/lanes/:id`

Success:
```json
{
  "ok": true,
  "data": {
    "_id": "lane-004"
  }
}
```

Business error:
```json
{
  "ok": false,
  "error": "Lane cannot be deleted because it still contains cards"
}
```

`PATCH /api/lanes/:id/move`

Request:
```json
{
  "targetOrder": 1
}
```

Success:
```json
{
  "ok": true,
  "data": {
    "_id": "lane-004",
    "title": "Blocked",
    "order": 1,
    "createdAt": "2026-05-13T12:00:00Z"
  }
}
```

Validation error:
```json
{
  "ok": false,
  "error": "Invalid targetOrder: order out of bounds"
}
```

Not found:
```json
{
  "ok": false,
  "error": "Lane not found"
}
```

### Data Layer

Lane collection remains:
- `_id`
- `title`
- `order`
- `createdAt`

Additional backend expectations:
- normalize `title` during validation
- check uniqueness before insert
- check card count before delete
- reorder remaining lanes after delete
- reorder lane orders without touching cards

Recommended indexes:
- `lanes.order`
- `cards.laneId`
- optional unique normalized title strategy if product confirms uniqueness rule

### Frontend

Required UI additions:
- global or trailing `Add Lane` action on board
- lane action menu or button for delete
- confirmation dialog for delete
- lane drag/reorder affordance or control
- inline validation and server error display

Required state additions in `Board.tsx`:
- `onLaneCreated`
- `onLaneDeleted`
- `onLaneReordered`
- rollback or refetch on lane mutation failure

### Documentation

Must update:
- `docs/API.md`
- `src/types/index.ts`
- `README.md` if lane behavior is no longer fixed to exactly 3 lanes
- `SKILL.md` if the workflow or feature list is updated

## Agent-Based Delivery Plan

### Phase 1: Architect

Owner:
- `.claude/agents/architect.md`

Tasks:
- update domain assumptions from fixed lanes to dynamic lanes
- define request/response types for lane create/delete/reorder
- update `docs/API.md`
- update `src/types/index.ts`
- document status code decisions for validation and business-rule failures

Deliverables:
- updated API contract
- updated TypeScript types
- short decision log for ambiguous rules

Definition of done:
- API and type contract fully cover lane create/delete/reorder
- all open product questions are marked as assumptions or blockers

### Phase 2: Backend Developer

Owner:
- `.claude/agents/backend-dev.md`

Tasks:
- implement `POST /api/lanes`
- implement `DELETE /api/lanes/:id`
- implement `PATCH /api/lanes/:id/move`
- add validation for trimmed title and uniqueness
- block delete when cards exist
- prevent deleting the final lane
- reorder lanes after deletion
- normalize lane order after reorder without touching cards
- adjust seed behavior only if needed for dynamic lane support

Deliverables:
- route handlers
- any shared validation/helper logic

Definition of done:
- endpoint behavior matches `docs/API.md`
- failure codes are correct
- persistence works after refresh

### Phase 3: Frontend Developer

Owner:
- `.claude/agents/frontend-dev.md`

Tasks:
- add `Add Lane` control to board UI
- add delete action in lane header
- add confirm flow for destructive action
- add lane reorder interaction
- show validation and business-rule errors
- update board state handlers for lane create/delete
- update board state handlers for lane reorder
- keep styling aligned with `docs/DESIGN_SYSTEM.md`

Deliverables:
- updated `Board.tsx`
- updated `Lane.tsx`
- any new lane form/dialog component if needed

Definition of done:
- users can create, delete, and reorder lanes from UI
- non-empty lane delete is blocked with clear feedback
- UI remains responsive and consistent with current design system

### Phase 4: QA Preparation

Owner:
- `.claude/agents/qa.md`

Tasks:
- draft test matrix early from API contract
- prepare API test cases for create/delete/reorder lane
- prepare component test cases for add/delete lane flows
- prepare component test cases for lane reorder flows
- prepare integration test for non-empty delete rejection

Deliverables:
- test checklist or test spec before implementation is finalized

Definition of done:
- all critical acceptance criteria are mapped to test cases

### Phase 5: Reviewer

Owner:
- `.claude/agents/reviewer.md`

Tasks:
- review API contract compliance
- review business-rule correctness
- review concurrency and stale UI risks
- review frontend rollback/error handling
- review naming, typing, and any accidental `any`

Definition of done:
- no blocker issues remain for logic, contract, or data integrity

### Phase 6: QA Execution

Owner:
- `.claude/agents/qa.md`

Tasks:
- implement and run tests
- verify positive and negative cases
- verify regression on existing card create/move/delete flows

Minimum tests:
- create lane success
- create lane validation failure
- create lane duplicate failure
- delete empty lane success
- delete non-empty lane blocked
- delete last lane blocked
- reorder lane success
- reorder lane validation failure
- reorder lane persistence after refresh
- board UI add lane flow
- board UI delete lane flow
- board UI reorder lane flow
- stale UI delete failure shows proper error

Definition of done:
- tests pass locally
- lane management regressions are covered

### Phase 7: DevOps Verification

Owner:
- `.claude/agents/devops.md`

Tasks:
- verify local and Docker startup still work
- verify seed + app startup with updated assumptions
- verify no environment variable changes are required

Definition of done:
- `docker compose up --build` still succeeds
- seeded board still loads without manual repair steps

## Recommended Execution Sequence

Use this sequence to get the best value from the current agents:

1. Architect finalizes API, types, and assumptions.
2. Backend Developer starts implementation.
3. Frontend Developer starts once the lane API contract is stable.
4. QA prepares tests in parallel with backend/frontend implementation.
5. Reviewer performs quality gate after implementation.
6. QA executes full test run after review fixes.
7. DevOps does final environment verification.

## Dependency Map

- Frontend depends on Architect contract and stable backend request/response shape.
- Backend depends on Architect contract.
- QA preparation depends on Architect contract.
- Reviewer depends on Backend and Frontend completion.
- QA execution depends on implementation and review fixes.
- DevOps verification depends on final merged implementation.

## Open Questions

Need product confirmation on:
- should lane creation use inline form or modal
- should lane reorder use drag handle only or full-column drag

## Suggested Next Command for the Team

1. Run `architect` to update `docs/API.md` and `src/types/index.ts`
2. Run `backend-dev` for lane endpoints
3. Run `frontend-dev` for board and lane actions
4. Run `reviewer`
5. Run `qa`
6. Run `devops`
