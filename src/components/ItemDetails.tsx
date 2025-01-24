import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { getItem } from '../lib/db';

interface ItemDetailsProps {
  id: string;
}

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
    hour12: true
  };
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

export default function ItemDetails({ id }: ItemDetailsProps) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItem = async () => {
      try {
        const data = await getItem(id);
        if (data) {
          setItem(data);
        } else {
          setError('Item not found');
        }
      } catch (err) {
        setError('Failed to load item');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error || !item) {
    return (
      <div className="text-red-500 text-center py-8">
        {error || 'Item not found'}
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold">{item.name}</h1>
        <Button asChild size="sm">
          <a href={`/items/${id}/edit`}>Edit</a>
        </Button>
      </div>

      <p className="opacity-90 mb-6">{item.description}</p>
      
      {item.tags?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {item.currentLocation && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Location</h2>
          <p className="opacity-90">{item.currentLocation}</p>
        </div>
      )}

      {item.photos?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {item.photos.map((photo: string, index: number) => (
              <img
                key={index}
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {item.locationHistory?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Location History</h2>
          <ul className="space-y-2">
            {item.locationHistory.map((history: any, index: number) => (
              <li key={index} className="opacity-90">
                <span className="font-medium">{history.location}</span>
                <br />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(history.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <Button
          variant="secondary"
          onClick={() => window.location.href = '/'}
        >
          Back to List
        </Button>
      </div>
    </div>
  );
}
