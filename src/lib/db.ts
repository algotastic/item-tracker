import { IDBPObjectStore, openDB } from 'idb';
import { Item } from '../types/Item';
import { Room } from '../types/Room';
import { LocationHistory } from '../types/LocationHistory';
import { Photo } from '../types/Photo';
import { SyncQueueItem } from '../types/SyncQueueItem';
import { DBSchema } from 'idb';

const dbName = 'orderlyDB';
const dbVersion = 2;

interface OrderlyDBSchema extends DBSchema {
  items: {
    key: string;
    value: Item;
    indexes: {
      'tags': string[];
      'room': string;
      'createdAt': string;
      'containerId': string;
      'isContainer': boolean;
      'lastSynced': Date;
      'container_path': string[];
      'container_immediate': string;
    };
  };
  rooms: {
    key: string;
    value: Room;
    indexes: { 'name': string };
  };
  locationHistory: {
    key: string;
    value: LocationHistory;
    indexes: { 'itemId': string; 'timestamp': string };
  };
  syncQueue: {
    key: number;
    value: SyncQueueItem;
    indexes: { 'itemId': string };
  };
  photos: {
    key: string;
    value: File;
  };
}

export const initDb = async () => {
  return openDB<OrderlyDBSchema>(dbName, dbVersion, {
    upgrade(db, oldVersion, newVersion) {
      // Create rooms store if it doesn't exist
      if (!db.objectStoreNames.contains('rooms')) {
        const roomsStore = db.createObjectStore('rooms', { keyPath: 'id' });
        roomsStore.createIndex('name', 'name');
      }
      
      // Create items store if it doesn't exist
      if (!db.objectStoreNames.contains('items')) {
        const itemsStore = db.createObjectStore('items', { keyPath: 'id' });
        itemsStore.createIndex('tags', 'tags', { multiEntry: true });
        itemsStore.createIndex('room', 'room');
        itemsStore.createIndex('createdAt', 'createdAt');
        itemsStore.createIndex('containerId', 'containerId');
        itemsStore.createIndex('isContainer', 'isContainer');
        itemsStore.createIndex('lastSynced', 'lastSynced');
        itemsStore.createIndex('container_path', 'location.path', { multiEntry: true });
        itemsStore.createIndex('container_immediate', 'location.containerId');
      }

      if (!db.objectStoreNames.contains('locationHistory')) {
        const locationStore = db.createObjectStore('locationHistory', { 
          keyPath: 'id'
        });
        locationStore.createIndex('itemId', 'itemId');
        locationStore.createIndex('timestamp', 'timestamp');
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { autoIncrement: true });
        syncStore.createIndex('itemId', 'itemId');
      }
    },
  });
};

// Room operations
export const addRoom = async (name: string) => {
  const db = await initDb();
  const tx = db.transaction('rooms', 'readwrite');
  const store = tx.objectStore('rooms');
  
  // Check for existing room with the same name
  const existingRooms = await store.index('name').getAll(name);
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
  const db = await initDb();
  const tx = db.transaction('rooms', 'readonly');
  const store = tx.objectStore('rooms');
  const rooms = await store.getAll();
  await tx.done;
  return rooms.sort((a, b) => a.name.localeCompare(b.name));
};

// Item operations
export const addItem = async (item: {
  name: string;
  description: string;
  tags: string[];
  room: string;
  spot?: string;
  photos?: string[];
}) => {
  const db = await initDb();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await db.items.add({
    id,
    ...item,
    createdAt: timestamp,
  });

  await addLocationHistory(id, item.room, item.spot);
  return id;
};

export const getItem = async (id: string) => {
  const db = await initDb();
  const item = await db.items.get(id);
  
  if (!item) {
    return null;
  }

  const locationHistory = await db.locationHistory.index('itemId').getAll(id);

  return {
    ...item,
    locationHistory: locationHistory.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
  };
};

export const updateItem = async (id: string, item: {
  name?: string;
  description?: string;
  tags?: string[];
  room?: string;
  spot?: string;
  photos?: string[];
}) => {
  const db = await initDb();
  const existingItem = await db.items.get(id);
  
  if (!existingItem) {
    throw new Error('Item not found');
  }

  const updatedItem = {
    ...existingItem,
    ...item,
  };

  await db.items.put(updatedItem);

  if (item.room || item.spot) {
    await addLocationHistory(id, item.room || existingItem.room, item.spot);
  }
};

// Location History operations
export const addLocationHistory = async (itemId: string, room: string, spot?: string) => {
  const db = await initDb();
  const id = crypto.randomUUID();
  
  await db.locationHistory.add({
    id,
    itemId,
    room,
    spot,
    timestamp: new Date().toISOString(),
  });
};

// Tag operations
export const getAllTags = async () => {
  const db = await initDb();
  const items = await db.items.getAll();
  const tags = new Set(items.flatMap(item => item.tags || []));
  return Array.from(tags).sort();
};

export const searchTags = async (query: string) => {
  const allTags = await getAllTags();
  return allTags.filter(tag => 
    tag.toLowerCase().includes(query.toLowerCase())
  );
};

// Search operations
export const searchItems = async (query: string) => {
  const db = await initDb();
  const items = await db.items.getAll();
  
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
};

// Export operations
export const exportToCsv = async (includePhotos: boolean = false) => {
  const db = await initDb();
  const items = await db.items.getAll();
  const rooms = await getRooms();
  const roomMap = new Map(rooms.map(room => [room.id, room.name]));

  return items.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    tags: item.tags.join(', '),
    room: roomMap.get(item.room) || '',
    spot: item.spot || '',
    photos: includePhotos ? (item.photos || []).join(', ') : '',
    createdAt: item.createdAt,
  }));
};

export async function recordItemMovement(
  itemId: string,
  newContainerId: string,
  context?: 'packing' | 'unpacking'
) {
  const db = await initDb();
  const item = await db.items.get(itemId);
  const newContainer = await db.items.get(newContainerId);

  if (!item || !newContainer) return;

  const historyEntry = {
    id: crypto.randomUUID(),
    itemId,
    fromPath: item.location.path,
    toPath: [...newContainer.location.path, newContainerId],
    timestamp: new Date().toISOString(),
    context
  };

  await db.locationHistory.add(historyEntry);
}
