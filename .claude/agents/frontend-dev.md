---
name: Frontend Development
description: Implement UI components and drag-and-drop with dnd-kit
type: agent
model: haiku
---

# Task: Frontend Development (UI + Drag & Drop)

You are the **Frontend Developer** for the Kanban Board.

## Prerequisites
- Backend API is complete and working
- `src/types/index.ts` is defined
- All endpoints respond correctly

## Your Role
- Build React components: `<Board>`, `<Lane>`, `<Card>`, `<NewCardForm>`, `<CardModal>`
- Implement drag-and-drop using **@dnd-kit/core** and **@dnd-kit/sortable**
- Create page `/src/app/page.tsx` that displays the board
- Styling: **Tailwind CSS only** (no separate CSS files)

## Components to Build

### 1. **`src/components/Board.tsx`** (Server Component)
- Fetch lanes from `GET /api/lanes`
- Layout: flex row of lanes
- Pass lane data to `<Lane>` components
- **Note**: Use Server Component for initial fetch

### 2. **`src/components/Lane.tsx`** (Client Component)
- Receives Lane with Cards
- Renders lane title + card count
- Contains `<Card>` components inside sortable container (@dnd-kit)
- Include `<NewCardForm>` button at bottom
- Styling: border, padding, semi-transparent background

### 3. **`src/components/Card.tsx`** (Client Component)
- Displays card title + description preview
- Draggable via @dnd-kit
- Click to open `<CardModal>`
- Styling: white bg, shadow, hover effect

### 4. **`src/components/NewCardForm.tsx`** (Client Component)
- Simple form: title input + submit button
- On submit: POST to `POST /api/cards` with `laneId`
- Use `useOptimistic` hook for instant UI update
- Clear input after success
- Handle errors gracefully

### 5. **`src/components/CardModal.tsx`** (Client Component)
- Modal overlay on card click
- Show title, description fields
- Edit form (PATCH `/api/cards/:id`)
- Delete button (DELETE `/api/cards/:id`)
- Close button
- **Optional**: Use native `<dialog>` or Tailwind modal pattern

## Drag & Drop Rules (@dnd-kit)

- **Within lane**: Reorder cards in same lane
- **Between lanes**: Move card to different lane
- **Implementation**:
  - Use `<DndContext>` at Board level
  - Each lane is a `<SortableContext>`
  - Each card is draggable via `useSortable(id)`
  - On drop: call `PATCH /api/cards/:id/move` with new `targetLaneId, targetOrder`

## UI/UX Rules

1. **Optimistic Updates**: Use `useOptimistic` when moving cards — don't block UI
2. **Error Handling**: Show toast/alert if API fails, revert optimistic update
3. **Loading States**: Show spinner while fetching initial board
4. **Styling**: Tailwind classes only, follow a consistent color scheme
   - Lanes: light gray background (`bg-gray-100`)
   - Cards: white with subtle shadow
   - Buttons: primary color (`bg-blue-500` or similar)
   - Hover effects for interactive elements

## File Structure
```
src/
  app/
    page.tsx                 ← main board page
    layout.tsx              ← app layout (already exists)
  components/
    Board.tsx
    Lane.tsx
    Card.tsx
    NewCardForm.tsx
    CardModal.tsx
```

## Tools
Use: Read, Write, Edit, Bash, Glob

## Success Criteria
- Board renders with 3 lanes
- Cards display inside lanes
- Can drag cards within lane (reorder)
- Can drag cards between lanes (move)
- After refresh: card position persists
- Add card form works
- Card modal opens/closes and saves changes
- No TypeScript errors
