import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase, StoreNames, IDBPTransaction, IDBPObjectStore } from 'idb';
import type { Item } from '../types/Item';
import type { Room } from '../types/Room';
import type { LocationHistory } from '../types/LocationHistory';
import type { Photo } from '../types/Photo';
import type { SyncQueueItem } from '../types/SyncQueueItem';

interface OrderlyDBSchema extends DBSchema {
  items: {
    value: Item;
    key: string;
    indexes: {
      'by-tags': string[];
      'by-room': string;
      'by-created': string;
      'by-container': string;
      'by-is-container': number;
      'by-last-synced': number;
      'by-path': string[];
    };
  };
  rooms: {
    value: Room;
    key: string;
    indexes: {
      'by-name': string;
    };
  };
  locationHistory: {
    value: LocationHistory;
    key: string;
    indexes: {
      'by-item': string;
      'by-timestamp': number;
    };
  };
  syncQueue: {
    value: SyncQueueItem;
    key: number;
    indexes: {
      'by-item': string;
    };
  };
  photos: {
    value: File;
    key: string;
  };
}

const dbName = 'orderlyDB';
const dbVersion = 3; // Incrementing version for schema changes

let dbPromise: Promise<IDBPDatabase<OrderlyDBSchema>> | null = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<OrderlyDBSchema>(dbName, dbVersion, {
      upgrade(db, oldVersion, newVersion) {
        // Handle version upgrades
        if (oldVersion < 1) {
          // Create initial stores
          if (!db.objectStoreNames.contains('items')) {
            const itemsStore = db.createObjectStore('items', { keyPath: 'id' });
            itemsStore.createIndex('by-tags', 'tags', { multiEntry: true });
            itemsStore.createIndex('by-room', 'room');
            itemsStore.createIndex('by-created', 'createdAt');
            itemsStore.createIndex('by-container', 'containerId');
            itemsStore.createIndex('by-is-container', 'isContainer');
            itemsStore.createIndex('by-last-synced', 'lastSynced');
            itemsStore.createIndex('by-path', 'location.path', { multiEntry: true });
          }

          if (!db.objectStoreNames.contains('rooms')) {
            const roomsStore = db.createObjectStore('rooms', { keyPath: 'id' });
            roomsStore.createIndex('by-name', 'name', { unique: true });
          }

          if (!db.objectStoreNames.contains('locationHistory')) {
            const historyStore = db.createObjectStore('locationHistory', { keyPath: 'id' });
            historyStore.createIndex('by-item', 'itemId');
            historyStore.createIndex('by-timestamp', 'timestamp');
          }

          if (!db.objectStoreNames.contains('syncQueue')) {
            const syncStore = db.createObjectStore('syncQueue', { autoIncrement: true });
            syncStore.createIndex('by-item', 'itemId');
          }

          if (!db.objectStoreNames.contains('photos')) {
            db.createObjectStore('photos', { keyPath: 's3Key' });
          }
        }

        // Add version 2 specific upgrades
        if (oldVersion < 2) {
          try {
            const itemsStore = db.objectStoreNames.contains('items') 
              ? db.transaction('items', 'versionchange').objectStore('items') as IDBPObjectStore<OrderlyDBSchema, ['items'], 'items', 'versionchange'>
              : db.createObjectStore('items', { keyPath: 'id' });

            if (itemsStore.indexNames && !itemsStore.indexNames.contains('by-is-container')) {
              itemsStore.createIndex('by-is-container', 'isContainer');
            }
          } catch (error) {
            console.error('Error upgrading to version 2:', error);
          }
        }

        // Add version 3 specific upgrades
        if (oldVersion < 3) {
          try {
            const itemsStore = db.objectStoreNames.contains('items')
              ? db.transaction('items', 'versionchange').objectStore('items') as IDBPObjectStore<OrderlyDBSchema, ['items'], 'items', 'versionchange'>
              : db.createObjectStore('items', { keyPath: 'id' });

            if (itemsStore.indexNames && !itemsStore.indexNames.contains('by-path')) {
              itemsStore.createIndex('by-path', 'location.path', { multiEntry: true });
            }
          } catch (error) {
            console.error('Error upgrading to version 3:', error);
          }
        }
      },
    });
  }
  return dbPromise;
}

// Room operations
export const addRoom = async (name: string) => {
  const db = await getDb();
  const tx = db.transaction('rooms', 'readwrite');
  const store = tx.objectStore('rooms');
  
  // Check for existing room with the same name
  const existingRooms = await store.index('by-name').getAll(name);
  if (existingRooms.length > 0) {
    await tx.done;
    throw new Error('A room with this name already exists');
  }

  const id = crypto.randomUUID();
  const room = { 
    id, 
    name,
    createdAt: new Date().toISOString()
  };
  
  await store.add(room);
  await tx.done;
  return id;
};

export const getRooms = async () => {
  const db = await getDb();
  const tx = db.transaction('rooms', 'readonly');
  const store = tx.objectStore('rooms');
  const rooms = await store.getAll();
  await tx.done;
  return rooms.sort((a, b) => a.name.localeCompare(b.name));
};

// Item operations
export async function addItem(item: {
  name: string;
  description: string;
  tags: string[];
  location: {
    type: 'container' | 'room';
    containerId?: string;
    roomId?: string;
    path: string[];
  };
  photos?: Photo[];
  isContainer?: boolean;
  containerType?: 'permanent' | 'temporary';
}) {
  const db = await getDb();
  const tx = db.transaction(['items', 'locationHistory'] as const, 'readwrite');
  
  try {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const newItem: Item = {
      id,
      ...item,
      version: 1,
      createdAt: timestamp,
      isContainer: item.isContainer || false,
      location: {
        type: item.location.type,
        containerId: item.location.containerId,
        roomId: item.location.roomId,
        path: item.location.path,
      },
      tags: item.tags || [],
    };

    await tx.objectStore('items').add(newItem);

    const historyEntry: LocationHistory = {
      id: crypto.randomUUID(),
      itemId: id,
      fromPath: [],
      toPath: [...item.location.path, 
              item.location.type === 'container' 
                ? (item.location.containerId || 'unknown')
                : (item.location.roomId || 'unknown')],
      timestamp: new Date().toISOString(),
    };

    await tx.objectStore('locationHistory').add(historyEntry);
    await tx.done;
    
    return id;
  } catch (error) {
    await tx.abort();
    console.error('Error adding item:', error);
    throw error;
  }
}

export async function getItem(id: string) {
  const db = await getDb();
  const tx = db.transaction(['items', 'locationHistory'], 'readonly');
  
  try {
    const itemStore = tx.objectStore('items');
    const historyStore = tx.objectStore('locationHistory');
    
    const item = await itemStore.get(id);
    if (!item) {
      await tx.done;
      return null;
    }

    const locationHistory = await historyStore.index('by-item').getAll(id);
    await tx.done;

    return {
      ...item,
      locationHistory: locationHistory.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    };
  } catch (error) {
    await tx.abort();
    console.error('Error getting item:', error);
    throw error;
  }
}

export async function updateItem(id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'lastSynced'>>) {
  const db = await getDb();
  const tx = db.transaction(['items', 'locationHistory'] as const, 'readwrite');
  
  try {
    const itemStore = tx.objectStore('items');
    const existingItem = await itemStore.get(id);
    
    if (!existingItem) {
      await tx.abort();
      throw new Error('Item not found');
    }

    // Ensure location.path is always defined
    if (updates.location && !updates.location.path) {
      updates.location.path = [];
    }

    const updatedItem: Item = {
      ...existingItem,
      ...updates,
      version: (existingItem.version || 0) + 1,
      lastSynced: new Date(),
    };

    await itemStore.put(updatedItem);

    // Only check location changes if updates.location exists
    const locationChanged = updates.location && (
      updates.location.type !== existingItem.location.type ||
      updates.location.containerId !== existingItem.location.containerId ||
      updates.location.roomId !== existingItem.location.roomId ||
      !arraysEqual(updates.location.path, existingItem.location.path)
    );

    if (locationChanged && updates.location) {
      const historyStore = tx.objectStore('locationHistory');
      const historyEntry: LocationHistory = {
        id: crypto.randomUUID(),
        itemId: id,
        fromPath: existingItem.location.path,
        toPath: updates.location.path,
        timestamp: new Date().toISOString(),
      };
      
      await historyStore.add(historyEntry);
    }

    await tx.done;
    return updatedItem;
  } catch (error) {
    await tx.abort();
    console.error('Error updating item:', error);
    throw error;
  }
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

// Location History operations
export const addLocationHistory = async (itemId: string, containerId: string) => {
  const db = await getDb();
  const tx = db.transaction(['items', 'locationHistory'] as const, 'readwrite');
  
  const item = await tx.objectStore('items').get(itemId);
  const container = await tx.objectStore('items').get(containerId);
  
  if (!item || !container) return;
  
  const id = crypto.randomUUID();
  const historyEntry: LocationHistory = {
    id,
    itemId,
    fromPath: item.location.path,
    toPath: [...container.location.path, containerId],
    timestamp: new Date().toISOString(),
  };
  
  await tx.objectStore('locationHistory').add(historyEntry);
  await tx.done;
};

// Tag operations
export async function getAllTags() {
  const db = await getDb();
  const tx = db.transaction('items', 'readonly');
  
  try {
    const items = await tx.objectStore('items').getAll();
    const tags = new Set<string>(items.flatMap(item => item.tags || []));
    await tx.done;
    return Array.from(tags).sort();
  } catch (error) {
    await tx.abort();
    console.error('Error getting tags:', error);
    throw error;
  }
}

export const searchTags = async (query: string) => {
  const allTags = await getAllTags();
  return allTags.filter(tag => 
    tag.toLowerCase().includes(query.toLowerCase())
  );
};

// Search operations
export async function searchItems(query: string) {
  const db = await getDb();
  const tx = db.transaction('items', 'readonly');
  
  try {
    const items = await tx.objectStore('items').getAll();
    await tx.done;

    if (!query) {
      return items.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const searchTerms = query.toLowerCase().split(' ');
    return items
      .filter(item => {
        const searchText = `
          ${item.name.toLowerCase()}
          ${item.description.toLowerCase()}
          ${item.tags.join(' ').toLowerCase()}
        `;
        return searchTerms.every(term => searchText.includes(term));
      })
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch (error) {
    await tx.abort();
    console.error('Error searching items:', error);
    throw error;
  }
}

// Export operations
export async function exportToCsv(includePhotos: boolean = false) {
  const db = await getDb();
  const tx = db.transaction(['items', 'rooms'], 'readonly');
  
  try {
    const items = await tx.objectStore('items').getAll();
    const rooms = await tx.objectStore('rooms').getAll();
    await tx.done;

    const roomMap = new Map(rooms.map(room => [room.id, room.name]));

    return items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      tags: item.tags.join(', '),
      location: item.location.containerId ? roomMap.get(item.location.containerId) || 'Unknown' : '',
      photos: includePhotos ? (item.photos || []).map(p => p.s3Key).join(', ') : '',
      createdAt: item.createdAt,
    }));
  } catch (error) {
    await tx.abort();
    console.error('Error exporting to CSV:', error);
    throw error;
  }
}

export async function recordItemMovement(
  itemId: string,
  newContainerId: string,
  context?: 'packing' | 'unpacking'
) {
  const db = await getDb();
  const tx = db.transaction(['items', 'locationHistory'] as const, 'readwrite');
  
  try {
    const item = await tx.objectStore('items').get(itemId);
    const newContainer = await tx.objectStore('items').get(newContainerId);

    if (!item || !newContainer) {
      await tx.abort();
      return;
    }

    const historyEntry: LocationHistory = {
      id: crypto.randomUUID(),
      itemId,
      fromPath: item.location.path,
      toPath: [...newContainer.location.path, newContainerId],
      timestamp: new Date().toISOString(),
      context
    };

    await tx.objectStore('locationHistory').add(historyEntry);
    await tx.done;
  } catch (error) {
    await tx.abort();
    console.error('Error recording movement:', error);
    throw error;
  }
}
