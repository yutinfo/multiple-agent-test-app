'use client';

import { Card } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CardComponentProps {
  card: Card;
  onClick: () => void;
}

export default function CardComponent({ card, onClick }: CardComponentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: card._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-white border border-gray-200 rounded-lg shadow p-3 cursor-grab active:cursor-grabbing
        hover:shadow-lg transition-shadow duration-200
        ${isDragging ? 'ring-2 ring-blue-400' : ''}
      `}
    >
      <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">
        {card.title}
      </h3>
      {card.description && (
        <p className="text-xs text-gray-600 line-clamp-2">
          {card.description}
        </p>
      )}
    </div>
  );
}
