import React from 'react';

interface Item {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  tags?: string[];
}

interface ItemCardProps {
  item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      {item.imageUrl && (
        <div className="relative aspect-square">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="object-cover w-full h-full rounded-t-lg"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{item.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
        {item.tags && (
          <div className="flex gap-2 mt-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
