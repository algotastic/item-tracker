import React, { useState, useEffect, Fragment } from 'react';
import { Button } from './ui/button';
import { getItem, getDb } from '../lib/db';
import { getContainerPath } from '../lib/containers';
import type { Item } from '../types/Item';
import type { LocationHistory } from '../types/LocationHistory';
import { ChevronRight } from 'lucide-react';

interface ItemDetailsProps {
  id: string;
}

interface ItemWithHistory extends Item {
  locationHistory?: LocationHistory[];
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

function LocationPath({ path }: { path: string[] }) {
  const [containers, setContainers] = useState<Item[]>([]);

  useEffect(() => {
    const loadContainers = async () => {
      const db = await getDb();
      const tx = db.transaction('items', 'readonly');
      const store = tx.objectStore('items');
      const containerData = await Promise.all(
        path.map(id => store.get(id))
      );
      await tx.done;
      setContainers(containerData.filter((c): c is Item => c !== undefined));
    };

    loadContainers();
  }, [path]);

  return (
    <div className="flex gap-1 flex-wrap">
      {containers.map((container, index) => (
        <Fragment key={container.id}>
          <span>{container.name}</span>
          {index < containers.length - 1 && (
            <ChevronRight className="w-4 h-4 mx-1" />
          )}
        </Fragment>
      ))}
    </div>
  );
}

export default function ItemDetails({ id }: ItemDetailsProps) {
  const [item, setItem] = useState<ItemWithHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerPath, setContainerPath] = useState('Loading location...');

  useEffect(() => {
    const loadItem = async () => {
      try {
        const data = await getItem(id);
        if (data) {
          setItem(data as ItemWithHistory);
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

  useEffect(() => {
    let isMounted = true;
    
    const loadPath = async () => {
      try {
        const path = await getContainerPath(item?.location.containerId);
        if (isMounted) setContainerPath(path);
      } catch {
        if (isMounted) setContainerPath('Location unavailable');
      }
    };

    if (item) loadPath();
    return () => { isMounted = false };
  }, [item]);

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

      {item.location && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Location</h2>
          <LocationPath path={item.location.path} />
        </div>
      )}

      {Array.isArray(item.photos) && item.photos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {item.photos.map((photo, index) => (
              <img
                key={index}
                src={photo.thumbnailUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {Array.isArray(item.locationHistory) && item.locationHistory.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Location History</h2>
          <ul className="space-y-2">
            {item.locationHistory.map((history: LocationHistory) => (
              <li key={history.id} className="opacity-90">
                <span className="font-medium">
                  {history.toPath.join(' → ')}
                </span>
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
