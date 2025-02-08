import { getDb } from './db';
import type { Item } from '../types/Item';
import type { SyncQueueItem } from '../types/SyncQueueItem';
import type { Photo } from '../types/Photo';
import type { DBSchema, IDBPObjectStore } from 'idb';

interface SyncResult {
  updatedItems: Item[];
  conflicts: Array<{
    item: Item;
    conflictType: string;
  }>;
}

type QueueItemInput = Omit<SyncQueueItem, 'id'>;

interface SyncQueueStore extends DBSchema {
  syncQueue: {
    value: QueueItemInput;
    key: number;
    indexes: {
      'by-item': string;
    };
  };
}

const AWS_CONFIG = {
  region: import.meta.env.PUBLIC_AWS_REGION,
  appSyncUrl: import.meta.env.PUBLIC_APPSYNC_URL,
  s3Bucket: import.meta.env.PUBLIC_S3_BUCKET
};

export async function syncWithCloud() {
  const db = await getDb();
  const tx = db.transaction(['items', 'syncQueue'], 'readwrite');
  const itemStore = tx.objectStore('items');
  const queueStore = tx.objectStore('syncQueue') as unknown as IDBPObjectStore<SyncQueueStore, ['syncQueue'], 'syncQueue', 'readwrite'>;
  let items: Item[] = [];
  let queue: Array<SyncQueueItem & { id: number }> = [];
  
  try {
    // Properly access object stores through transaction
    items = await itemStore.getAll();
    const queueItems = await queueStore.getAll();
    queue = queueItems.map((item, index) => ({ ...item, id: index + 1 }));

    // Implement AppSync resolver
    const result = await resolveConflicts([...items, ...queue]);
    
    // Update items using the store reference
    for (const item of result.updatedItems) {
      await itemStore.put(item);
    }
    
    // Delete queue items using the store reference
    for (const queueItem of queue) {
      await queueStore.delete(queueItem.id);
    }
    
    // Upload pending photos
    await syncPhotos(db);
    await tx.done;
    
  } catch (error) {
    await tx.abort();
    console.error('Sync failed:', error);
    
    // Add to queue using the store reference
    for (const item of items) {
      const queueItem: QueueItemInput = {
        itemId: item.id,
        operation: 'update',
        timestamp: new Date(),
        attempts: 0
      };
      const id = await queueStore.add(queueItem);
      console.log('Added to sync queue:', id);
    }
  }
}

async function resolveConflicts(items: (Item | SyncQueueItem)[]): Promise<SyncResult> {
  const response = await fetch(AWS_CONFIG.appSyncUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.PUBLIC_APPSYNC_KEY
    },
    body: JSON.stringify({
      query: `mutation Sync($operations: [SyncOperation!]!) {
        sync(operations: $operations) {
          resolvedItems {
            id
            name
            description
            tags
            location {
              type
              containerId
              roomId
              path
            }
            photos {
              s3Key
              thumbnailUrl
              fullResUrl
              uploaded
            }
            isContainer
            containerType
            createdAt
            version
            lastSynced
            insuredValue
            purchaseDate
            serialNumber
          }
          conflicts {
            item {
              id
            }
            conflictType
          }
        }
      }`,
      variables: { operations: items }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.statusText}`);
  }
  
  const { data } = await response.json();
  return data.sync;
}

async function syncPhotos(db: Awaited<ReturnType<typeof getDb>>) {
  const tx = db.transaction(['items', 'photos'], 'readonly');
  const itemStore = tx.objectStore('items');
  const photoStore = tx.objectStore('photos');
  
  try {
    const items = await itemStore.getAll();
    const photos = items.flatMap(i => i.photos?.filter(p => !p.uploaded) || []);
    
    for (const photo of photos) {
      const file = await photoStore.get(photo.s3Key);
      if (!file) continue;

      const uploadUrl = await getPresignedUrl(photo.s3Key);
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload photo ${photo.s3Key}: ${uploadResponse.statusText}`);
      }

      photo.uploaded = true;
    }
    await tx.done;
  } catch (error) {
    await tx.abort();
    throw error;
  }
}

async function getPresignedUrl(key: string): Promise<string> {
  const response = await fetch(`${AWS_CONFIG.s3Bucket}/presigned-url/${encodeURIComponent(key)}`);
  if (!response.ok) {
    throw new Error(`Failed to get presigned URL: ${response.statusText}`);
  }
  return response.text();
}

export async function syncItem(item: Item) {
  const db = await getDb();
  const tx = db.transaction('items', 'readwrite');
  const store = tx.objectStore('items');
  
  try {
    const existingItem = await store.get(item.id);
    if (existingItem) {
      const updatedItem: Item = {
        ...existingItem,
        ...item,
        lastSynced: new Date(),
        version: (existingItem.version || 0) + 1
      };
      await store.put(updatedItem);
    }
    await tx.done;
  } catch (error) {
    await tx.abort();
    throw error;
  }
}

export async function syncQueue() {
  const db = await getDb();
  const tx = db.transaction(['syncQueue', 'items'], 'readwrite');
  const queueStore = tx.objectStore('syncQueue');
  const itemStore = tx.objectStore('items');
  
  try {
    const queue = await queueStore.getAll();
    
    for (const queueItem of queue) {
      const item = await itemStore.get(queueItem.itemId);
      if (item) {
        await syncItem(item);
      }
      await queueStore.delete(queueItem.id);
    }
    await tx.done;
  } catch (error) {
    await tx.abort();
    throw error;
  }
}

export async function addToSyncQueue(item: Item) {
  const db = await getDb();
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue') as unknown as IDBPObjectStore<SyncQueueStore, ['syncQueue'], 'syncQueue', 'readwrite'>;
  
  try {
    const queueItem: QueueItemInput = {
      itemId: item.id,
      operation: 'update',
      timestamp: new Date(),
      attempts: 0,
      lastAttempt: undefined
    };
    const id = await store.add(queueItem);
    console.log('Added to sync queue:', id);
    await tx.done;
  } catch (error) {
    await tx.abort();
    throw error;
  }
} 