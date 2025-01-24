import { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface ItemDetailsProps {
  id: string;
}

export default function ItemDetails({ id }: ItemDetailsProps) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch item details
    setItem({
      id,
      name: 'Sample Item',
      description: 'Sample description',
      tags: ['tag1', 'tag2'],
      location: 'Sample location'
    });
    setLoading(false);
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!item) return <div>Item not found</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-2xl font-bold mb-4">{item.name}</h1>
      <p className="text-gray-600 mb-4">{item.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {item.tags.map((tag: string) => (
          <span key={tag} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
            {tag}
          </span>
        ))}
      </div>

      {item.location && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Location</h2>
          <p className="text-gray-600">{item.location}</p>
        </div>
      )}

      <div className="mt-6">
        <Button asChild>
          <a href={`/items/${id}/edit`}>Edit Item</a>
        </Button>
      </div>
    </div>
  );
}
