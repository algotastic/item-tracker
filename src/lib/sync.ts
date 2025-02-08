import { initDb } from './db';

const AWS_CONFIG = {
  region: import.meta.env.PUBLIC_AWS_REGION,
  appSyncUrl: import.meta.env.PUBLIC_APPSYNC_URL,
  s3Bucket: import.meta.env.PUBLIC_S3_BUCKET
};

export async function syncWithCloud() {
  const db = await initDb();
  const tx = db.transaction(['items', 'syncQueue'], 'readwrite');
  
  // Properly access object stores through transaction
  const itemsStore = tx.objectStore('items');
  const queueStore = tx.objectStore('syncQueue');
  
  const items = await itemsStore.getAll(IDBKeyRange.upperBound(new Date()));
  const queue = await queueStore.getAll();

  try {
    // Implement AppSync resolver
    const result = await resolveConflicts([...items, ...queue]);
    
    // Update items using the store reference
    for (const item of result.updatedItems) {
      await itemsStore.put(item);
    }
    
    // Delete queue items using the store reference
    for (const queueItem of queue) {
      await queueStore.delete(queueItem.id);
    }
    
    // Upload pending photos
    await syncPhotos(db);
    
  } catch (error) {
    console.error('Sync failed:', error);
    // Add to queue using the store reference
    for (const item of items) {
      await queueStore.add(item);
    }
  }
}

async function resolveConflicts(items: any[]) {
  const response = await fetch(AWS_CONFIG.appSyncUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.PUBLIC_APPSYNC_KEY
    },
    body: JSON.stringify({
      query: `mutation Sync($operations: [SyncOperation!]!) {
        sync(operations: $operations) {
          resolvedItems
          conflicts
        }
      }`,
      variables: { operations: items }
    })
  });
  
  const { data } = await response.json();
  return data.sync; // Contains resolvedItems and conflicts
}

async function syncPhotos(db: Awaited<ReturnType<typeof initDb>>) {
  const items = await db.items.getAll();
  const photos = items.flatMap(i => i.photos?.filter(p => !p.uploaded) || []);
  
  for (const photo of photos) {
    const file = await db.photos.get(photo.s3Key);
    const uploadUrl = await getPresignedUrl(photo.s3Key);
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file
    });
    photo.uploaded = true;
  }
}

async function getPresignedUrl(key: string) {
  return `${AWS_CONFIG.s3Bucket}/presigned-url/${encodeURIComponent(key)}`;
} 