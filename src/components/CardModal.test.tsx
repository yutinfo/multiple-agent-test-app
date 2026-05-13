import { ObjectId } from 'mongodb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardModal from './CardModal';
import { Card } from '@/types';

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    _id: new ObjectId().toString(),
    laneId: new ObjectId().toString(),
    title: 'Existing card',
    description: 'Smoke test',
    order: 0,
    createdAt: new Date('2026-05-13T00:00:00Z'),
    updatedAt: new Date('2026-05-13T00:00:00Z'),
    ...overrides,
  };
}

describe('CardModal', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders card details', () => {
    const card = makeCard();
    render(
      <CardModal
        card={card}
        onClose={vi.fn()}
        onCardUpdated={vi.fn()}
        onCardDeleted={vi.fn()}
      />
    );

    expect(screen.getByText('Card Details')).toBeInTheDocument();
    expect(screen.getByText('Existing card')).toBeInTheDocument();
    expect(screen.getByText('Smoke test')).toBeInTheDocument();
  });

  it('deletes a card and closes the modal', async () => {
    const user = userEvent.setup();
    const card = makeCard();
    const onClose = vi.fn();
    const onCardDeleted = vi.fn();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, data: { _id: card._id } }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    render(
      <CardModal
        card={card}
        onClose={onClose}
        onCardUpdated={vi.fn()}
        onCardDeleted={onCardDeleted}
      />
    );

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(onCardDeleted).toHaveBeenCalledWith(card._id);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
