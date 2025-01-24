import { openDB } from 'idb';

const dbName = 'orderlyDB';
const dbVersion = 2; // Increment version to force upgrade

const initDb = async () => {
  return openDB(dbName, dbVersion, {
    upgrade(db, oldVersion, newVersion) {
      // If rooms store exists, delete it to recreate
      if (db.objectStoreNames.contains('rooms')) {
        db.deleteObjectStore('rooms');
      }
      
      // Create rooms store without unique index initially
      const roomsStore = db.createObjectStore('rooms', { keyPath: 'id' });
      roomsStore.createIndex('name', 'name');
      
      // Create other stores if they don't exist
      if (!db.objectStoreNames.contains('items')) {
        const itemsStore = db.createObjectStore('items', { keyPath: 'id' });
        itemsStore.createIndex('tags', 'tags', { multiEntry: true });
        itemsStore.createIndex('room', 'room');
        itemsStore.createIndex('spot', 'spot');
        itemsStore.createIndex('createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains('spots')) {
        const spotsStore = db.createObjectStore('spots', { keyPath: 'id' });
        spotsStore.createIndex('roomId', 'roomId');
        spotsStore.createIndex('name', 'name');
      }

      if (!db.objectStoreNames.contains('locationHistory')) {
        const locationStore = db.createObjectStore('locationHistory', { keyPath: 'id' });
        locationStore.createIndex('itemId', 'itemId');
        locationStore.createIndex('timestamp', 'timestamp');
      }
    },
  });
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

  await db.add('items', {
    id,
    ...item,
    createdAt: timestamp,
  });

  await addLocationHistory(id, item.room, item.spot);
  return id;
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
  const existingItem = await db.get('items', id);
  
  if (!existingItem) {
    throw new Error('Item not found');
  }

  const updatedItem = {
    ...existingItem,
    ...item,
  };

  await db.put('items', updatedItem);

  if (item.room || item.spot) {
    await addLocationHistory(id, item.room || existingItem.room, item.spot);
  }
};

export const getItem = async (id: string) => {
  const db = await initDb();
  const item = await db.get('items', id);
  
  if (!item) {
    return null;
  }

  const locationHistory = await db.getAllFromIndex(
    'locationHistory',
    'itemId',
    id
  );

  return {
    ...item,
    locationHistory: locationHistory.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
  };
};

export const searchItems = async (query: string) => {
  const db = await initDb();
  const items = await db.getAll('items');
  
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

// Room operations
export const addRoom = async (name: string) => {
  const db = await initDb();
  
  // Use a transaction to ensure consistency
  const tx = db.transaction('rooms', 'readwrite');
  const store = tx.objectStore('rooms');
  
  // Check for existing room with the same name
  const existingRooms = await store.index('name').getAll(name);
  if (existingRooms.length > 0) {
    await tx.done; // Complete the transaction
    throw new Error('A room with this name already exists');
  }

  const id = crypto.randomUUID();
  const room = { 
    id, 
    name,
    createdAt: new Date().toISOString()
  };
  
  await store.add(room);
  await tx.done; // Wait for transaction to complete
  
  console.log('Added room:', room);
  return id;
};

export const getRooms = async () => {
  const db = await initDb();
  const tx = db.transaction('rooms', 'readonly');
  const store = tx.objectStore('rooms');
  const rooms = await store.getAll();
  await tx.done;
  
  console.log('Retrieved rooms:', rooms);
  return rooms.sort((a, b) => a.name.localeCompare(b.name));
};

// Spot operations
export const addSpot = async (roomId: string, name: string) => {
  const db = await initDb();
  const id = crypto.randomUUID();
  await db.add('spots', { id, roomId, name });
  return id;
};

export const getSpotsByRoom = async (roomId: string) => {
  const db = await initDb();
  const spots = await db.getAllFromIndex('spots', 'roomId', roomId);
  return spots.sort((a, b) => a.name.localeCompare(b.name));
};

// Location History operations
export const addLocationHistory = async (itemId: string, room: string, spot?: string) => {
  const db = await initDb();
  const id = crypto.randomUUID();
  
  await db.add('locationHistory', {
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
  const items = await db.getAll('items');
  const tags = new Set(items.flatMap(item => item.tags || []));
  return Array.from(tags).sort();
};

export const searchTags = async (query: string) => {
  const allTags = await getAllTags();
  return allTags.filter(tag => 
    tag.toLowerCase().includes(query.toLowerCase())
  );
};

// Export operations
export const exportToCsv = async (includePhotos: boolean = false) => {
  const db = await initDb();
  const items = await db.getAll('items');
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

// TypeScript interfaces
export interface Item {
  id: string;
  name: string;
  description: string;
  tags: string[];
  room: string;
  spot?: string;
  photos?: string[];
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  createdAt: string;
}

export interface Spot {
  id: string;
  roomId: string;
  name: string;
}

export interface LocationHistory {
  id: string;
  itemId: string;
  room: string;
  spot?: string;
  timestamp: string;
}
