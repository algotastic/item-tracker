import React from 'react';
import { Button } from './ui/button';
import { MapPin } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  description: string;
  currentLocation?: string;
  imageUrl?: string;
  tags?: string[];
}

interface ItemCardProps {
  item: Item;
  onTagClick: (tag: string) => void;
  onLocationClick: (location: string) => void;
}

export default function ItemCard({ item, onTagClick, onLocationClick }: ItemCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      {item.imageUrl && (
        <div className="relative aspect-square">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="object-cover w-full h-full rounded-t-lg"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{item.name}</h3>
        {item.currentLocation && (
          <button
            onClick={() => onLocationClick(item.currentLocation!)}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1 hover:text-primary"
          >
            <MapPin className="w-4 h-4" />
            <span>{item.currentLocation}</span>
          </button>
        )}
        <p className="text-sm opacity-90 mt-2">{item.description}</p>
        {item.tags && (
          <div className="flex flex-wrap gap-2 mt-2">
            {item.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs hover:bg-secondary/80"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <a href={`/items/${item.id}`}>View</a>
          </Button>
          <Button asChild size="sm">
            <a href={`/items/${item.id}/edit`}>Edit</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
