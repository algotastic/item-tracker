import { useState, useEffect } from 'react';
import { searchItems } from '../lib/db';
import ItemCard from './ItemCard';

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      const results = await searchItems('');
      setItems(results);
    } catch (err) {
      setError('Failed to load items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load items on mount and when component gains focus
  useEffect(() => {
    loadItems();

    // Reload items when the window regains focus
    window.addEventListener('focus', loadItems);
    return () => window.removeEventListener('focus', loadItems);
  }, []);

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
      {loading && (
        <div className="col-span-full text-center py-8">Loading...</div>
      )}
      {!loading && items.length === 0 && (
        <div className="col-span-full text-center py-8">
          No items found. Add some items to get started!
        </div>
      )}
    </div>
  );
}
