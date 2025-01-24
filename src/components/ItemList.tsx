import { useState } from 'react';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import ItemCard from './ItemCard';

// Mock data for development
const mockItems = [
  {
    id: '1',
    title: 'Sample Item 1',
    description: 'This is a sample item description',
    tags: ['tag1', 'tag2']
  },
  {
    id: '2',
    title: 'Sample Item 2',
    description: 'Another sample item description',
    tags: ['tag2', 'tag3']
  }
];

export default function ItemList() {
  const [items, setItems] = useState(mockItems);
  const [loading, setLoading] = useState(false);

  // TODO: Implement infinite scroll
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
      {loading && <div>Loading...</div>}
    </div>
  );
}
