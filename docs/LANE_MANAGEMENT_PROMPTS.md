# Lane Management Prompt Pack

## Purpose

Prompt ชุดนี้ใช้สำหรับสั่งงาน feature:
- เพิ่ม lane / column
- ลบ lane / column
- ห้ามลบ lane ถ้ายังมี card อยู่

Prompt ถูกออกแบบให้ใช้กับโครงสร้าง agents ปัจจุบันของโปรเจกต์นี้โดยตรง

อ้างอิงงานหลัก:
- `docs/LANE_MANAGEMENT_TASKS.md`
- `docs/API.md`
- `src/types/index.ts`
- `.claude/agents/*.md`

## Recommended Assumptions

ถ้ายังไม่มี product decision เพิ่ม ให้ใช้ assumptions นี้ไปก่อน:
- default seeded lanes ลบได้ถ้าว่าง
- lane title required และ trim ก่อน validate
- lane title ต้อง unique แบบ case-insensitive
- lane ใหม่เพิ่มท้ายสุด
- ต้องเหลืออย่างน้อย 1 lane
- ถ้าลบ lane ไม่ได้เพราะมี card ให้ตอบ `409 Conflict`

## Master Orchestrator Prompt

ใช้ prompt นี้กับ agent หลักหรือใช้เป็น kickoff prompt ก่อนแยกงานให้ subagents

```text
You are the lead delivery coordinator for this Kanban Board repository.

Your mission is to deliver the Lane Management feature end-to-end using the existing agent structure in `.claude/agents/`.

Feature scope:
- users can create a new lane/column
- users can delete a lane/column
- a lane cannot be deleted if it still contains one or more cards

Primary reference:
- docs/LANE_MANAGEMENT_TASKS.md

Important assumptions to use unless the codebase or product docs clearly say otherwise:
- default seeded lanes can be deleted if empty
- lane title is required and trimmed
- lane title must be unique, case-insensitive
- new lane is added at the end of the board
- the system must always keep at least 1 lane
- deleting a non-empty lane should return 409 Conflict

Your job:
1. Read the current implementation and the task document.
2. Use the existing agents to execute the work with clear ownership.
3. Keep API contracts, TypeScript types, UI behavior, and tests aligned.
4. Preserve existing card CRUD and drag-and-drop behavior.
5. Do not stop at planning; drive the work through implementation, review, and verification.

Execution strategy:
1. Run Architect first to update API contract and types.
2. Then run Backend Developer for lane endpoints and business rules.
3. Then run Frontend Developer for board and lane UI actions.
4. In parallel where reasonable, have QA prepare test coverage from the updated contract.
5. Run Reviewer as the quality gate.
6. Run QA execution for tests and regression checks.
7. Run DevOps verification for local and Docker flow.

Definition of success:
- lane create/delete works in API and UI
- non-empty lane deletion is blocked
- last lane deletion is blocked
- board state remains consistent after refresh
- docs are updated
- tests cover the new feature and no obvious regressions remain

When you delegate, give each agent:
- explicit file ownership
- exact acceptance criteria
- expected output summary
- reminder not to modify unrelated files
```

## Architect Prompt

```text
You are the Architect agent for this repository.

Please implement the design and contract phase for the Lane Management feature.

Context:
- Read `docs/LANE_MANAGEMENT_TASKS.md` first.
- Review current lane and card contracts in `docs/API.md`.
- Review current shared types in `src/types/index.ts`.

Feature to design:
- create lane
- delete lane
- block lane deletion when cards exist

Assumptions to apply unless contradicted by existing product docs:
- default seeded lanes can be deleted if empty
- lane title is required and trimmed
- lane title must be unique, case-insensitive
- new lane is added at the end
- at least 1 lane must remain
- deleting a non-empty lane returns 409 Conflict

Your responsibilities:
- update API contracts for lane create/delete
- define request/response types in `src/types/index.ts`
- update `docs/API.md`
- document validation failures and business-rule failures clearly
- keep response shape consistent with `{ ok, data?, error? }`

Expected endpoint additions:
- POST `/api/lanes`
- DELETE `/api/lanes/:id`

Be explicit about:
- status codes
- validation messages
- duplicate title handling
- last lane delete rejection
- non-empty lane delete rejection

Deliverables:
1. Updated `docs/API.md`
2. Updated `src/types/index.ts`
3. A short summary of decisions and any remaining assumptions

Constraints:
- do not implement backend route logic
- do not edit frontend components
- keep the API contract internally consistent with the existing project style
```

## Backend Developer Prompt

```text
You are the Backend Developer agent for this repository.

Please implement the backend for the Lane Management feature.

Read first:
- `docs/LANE_MANAGEMENT_TASKS.md`
- `docs/API.md`
- `src/types/index.ts`
- existing route handlers in `src/app/api/`

Feature scope:
- create lane
- delete lane
- block deleting a non-empty lane
- block deleting the final remaining lane

Assumptions to use:
- lane title is required and trimmed
- lane title must be unique, case-insensitive
- new lane is inserted at the end
- delete non-empty lane returns 409 Conflict

Your responsibilities:
- implement POST `/api/lanes`
- implement DELETE `/api/lanes/:id`
- keep API responses in the existing `{ ok, data?, error? }` format
- validate title input
- enforce uniqueness
- check whether cards exist before delete
- reorder remaining lanes after successful delete
- preserve existing card APIs and behavior

Suggested file ownership:
- `src/app/api/lanes/route.ts`
- `src/app/api/lanes/[id]/route.ts` if needed
- shared backend helpers only if needed
- `scripts/seed.ts` only if dynamic lane support requires an adjustment

Implementation expectations:
- avoid unrelated refactors
- use MongoDB native driver only
- keep error handling explicit and user-safe
- do not break existing GET `/api/lanes`

Please also consider:
- stale UI delete request where the lane became non-empty just before deletion
- normalized title comparison for duplicate checks
- keeping `order` continuous after delete

Deliverables:
1. Working lane API endpoints
2. Brief summary of validations and status codes implemented
3. Any caveats around concurrency or data consistency
```

## Frontend Developer Prompt

```text
You are the Frontend Developer agent for this repository.

Please implement the UI for the Lane Management feature.

Read first:
- `docs/LANE_MANAGEMENT_TASKS.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/API.md`
- `src/components/Board.tsx`
- `src/components/Lane.tsx`

Feature scope:
- add lane from the board UI
- delete lane from the lane UI
- show clear feedback when lane deletion is blocked because cards exist

Assumptions to use:
- lane title is required and trimmed
- duplicate title should be rejected
- new lane is added at the end
- deleting the final lane is not allowed

Your responsibilities:
- add `Add Lane` control to the board
- add delete action in each lane header
- add confirmation flow for destructive delete
- show server validation/business-rule errors to the user
- update board state management for lane create/delete
- keep styling aligned with `docs/DESIGN_SYSTEM.md`
- preserve current card CRUD and drag-and-drop behavior

Suggested file ownership:
- `src/components/Board.tsx`
- `src/components/Lane.tsx`
- a new lane form or dialog component if needed

Implementation expectations:
- do not redesign the whole app
- avoid unrelated UI refactors
- keep interactions clear and responsive
- if optimistic update is used, make sure failure is handled cleanly
- if simpler, refetch after mutation rather than risking inconsistent state

Please cover:
- create success
- create validation error
- delete empty lane success
- delete non-empty lane blocked
- delete last lane blocked

Deliverables:
1. Updated board and lane UI
2. Short summary of the chosen UX flow
3. Any follow-up UI risks or tradeoffs
```

## Reviewer Prompt

```text
You are the Reviewer agent for this repository.

Please perform a focused code review for the Lane Management feature.

Read:
- `docs/LANE_MANAGEMENT_TASKS.md`
- updated `docs/API.md`
- updated `src/types/index.ts`
- backend and frontend changes related to lane management

Review goals:
- verify contract compliance
- verify business-rule correctness
- verify no regression to card CRUD and card move behavior
- verify TypeScript quality
- verify frontend error handling and state consistency

Pay special attention to:
- lane delete blocked when cards exist
- lane delete blocked when it is the final lane
- lane title validation and duplicate handling
- correct status codes, especially 409 vs 400 vs 404
- stale UI and race-condition-sensitive logic
- accidental `any`
- N+1 or avoidable query issues if introduced

Output format:
1. Findings ordered by severity
2. File references
3. Clear fix suggestions
4. Brief verdict: PASS / REVIEW / BLOCK

Do not edit files. Be precise and critical.
```

## QA Prompt

```text
You are the QA agent for this repository.

Please create and execute a focused test strategy for the Lane Management feature.

Read first:
- `docs/LANE_MANAGEMENT_TASKS.md`
- updated `docs/API.md`
- updated `src/types/index.ts`
- implementation changes in API and components

Feature scope to validate:
- create lane
- delete empty lane
- reject deleting non-empty lane
- reject deleting the final lane

Testing goals:
- verify the new feature
- verify regression safety for existing card flows

Minimum coverage to produce:
- API test: create lane success
- API test: create lane invalid title
- API test: create lane duplicate title
- API test: delete empty lane success
- API test: delete non-empty lane returns expected error/status
- API test: delete final lane returns expected error/status
- UI/component test: add lane flow
- UI/component test: delete lane flow
- UI/component test: blocked delete error feedback
- regression check: card create/move/delete still works

Execution guidance:
- keep tests narrow and high-value
- focus on the documented business rules
- note any missing test infrastructure if it blocks full automation

Deliverables:
1. Test files or test updates
2. Test results summary
3. Coverage/risk summary
4. Any untested gaps that still remain
```

## DevOps Prompt

```text
You are the DevOps agent for this repository.

Please verify that the Lane Management feature does not break the local or containerized developer workflow.

Read:
- `docs/LANE_MANAGEMENT_TASKS.md`
- `README.md`
- `Dockerfile`
- `docker-compose.yml`
- `scripts/seed.ts`

Your goals:
- verify seed flow still works
- verify app startup still works locally and in Docker
- verify no environment variable changes are required unless absolutely necessary
- verify the app still boots with the updated lane assumptions

Check for:
- broken startup due to new route paths or imports
- seed logic assumptions that still hardcode fixed lanes in a harmful way
- Docker build/runtime issues caused by the new feature

Deliverables:
1. Verification summary
2. Any required doc updates
3. Any environment or startup risks
```

## Fast-Start Prompt Sequence

ถ้าต้องการสั่งแบบเร็ว ให้ใช้ลำดับนี้:

1. Master Orchestrator Prompt
2. Architect Prompt
3. Backend Developer Prompt
4. Frontend Developer Prompt
5. Reviewer Prompt
6. QA Prompt
7. DevOps Prompt

## Short Command Version

ถ้าคุณอยากได้เวอร์ชันสั้นสำหรับคุยกับ agent หลัก:

```text
Implement the Lane Management feature end-to-end for this repository using the existing agents in `.claude/agents/`.

Requirements:
- users can create a lane
- users can delete a lane
- lane deletion is blocked if the lane still has cards
- deleting the final lane is blocked

Use `docs/LANE_MANAGEMENT_TASKS.md` as the source of truth.

Assumptions:
- lane title required and trimmed
- lane title unique, case-insensitive
- new lane added at the end
- non-empty lane delete returns 409 Conflict

Drive the work through:
1. contract/types update
2. backend implementation
3. frontend implementation
4. review
5. testing
6. devops verification

Preserve existing card CRUD and drag-and-drop behavior.
```
