/**
 * MongoDB Schema & API Type Definitions
 * For Kanban Board MVP
 */

import { ObjectId } from 'mongodb';

// ============================================================================
// MongoDB Document Models (Database layer)
// ============================================================================

export interface LaneDoc {
  _id: ObjectId;
  title: string;
  order: number;
  createdAt: Date;
}

export interface CardDoc {
  _id: ObjectId;
  laneId: ObjectId | string;
  title: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Domain Models (API Response layer)
// ============================================================================

export type Lane = {
  _id: string;
  title: string;
  order: number;
  createdAt: Date;
};

export type Card = {
  _id: string;
  laneId: string;
  title: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// Common Response Shape
// ============================================================================

export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

// ============================================================================
// GET /api/lanes
// ============================================================================

export type GetLanesRequest = undefined;

export type LaneWithCards = Lane & {
  cards: Card[];
};

export type GetLanesResponse = ApiResponse<LaneWithCards[]>;

// ============================================================================
// POST /api/lanes
// ============================================================================

export type CreateLaneRequest = {
  title: string;
};

export type CreateLaneResponse = ApiResponse<Lane>;

// ============================================================================
// DELETE /api/lanes/:id
// ============================================================================

export type DeleteLaneRequest = undefined;

export type DeleteLaneResponse = ApiResponse<{ _id: string }>;

// ============================================================================
// PATCH /api/lanes/:id/move
// ============================================================================

export type MoveLaneRequest = {
  targetOrder: number;
};

export type MoveLaneResponse = ApiResponse<Lane>;

// ============================================================================
// POST /api/cards
// ============================================================================

export type CreateCardRequest = {
  laneId: string;
  title: string;
  description?: string;
};

export type CreateCardResponse = ApiResponse<Card>;

// ============================================================================
// PATCH /api/cards/:id
// ============================================================================

export type UpdateCardRequest = {
  title?: string;
  description?: string;
};

export type UpdateCardResponse = ApiResponse<Card>;

// ============================================================================
// DELETE /api/cards/:id
// ============================================================================

export type DeleteCardRequest = undefined;

export type DeleteCardResponse = ApiResponse<{ _id: string }>;

// ============================================================================
// PATCH /api/cards/:id/move
// ============================================================================

export type MoveCardRequest = {
  targetLaneId: string;
  targetOrder: number;
};

export type MoveCardResponse = ApiResponse<Card>;

// ============================================================================
// Error Types
// ============================================================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
