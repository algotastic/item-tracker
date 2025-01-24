import { openDB } from 'idb';

const dbName = 'itemsDB';
const dbVersion = 1;

const initDb = async () => {
  return openDB(dbName, dbVersion, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('items')) {
        const itemsStore = db.createObjectStore('items', { keyPath: 'id' });
        itemsStore.createIndex('tags', 'tags', { multiEntry: true });
        itemsStore.createIndex('createdAt', 'createdAt');
      }
      
      if (!db.objectStoreNames.contains('locationHistory')) {
        const locationStore = db.createObjectStore('locationHistory', { keyPath: 'id' });
        locationStore.createIndex('itemId', 'itemId');
        locationStore.createIndex('timestamp', 'timestamp');
      }
    },
  });
};

export const addItem = async (item: {
  name: string;
  description: string;
  tags: string[];
  location?: string;
  photos?: string[];
}) => {
  const db = await initDb();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await db.add('items', {
    id,
    name: item.name,
    description: item.description,
    tags: item.tags,
    currentLocation: item.location,
    photos: item.photos || [],
    createdAt: timestamp,
  });

  if (item.location) {
    await addLocationHistory(id, item.location);
  }

  return id;
};

export const updateItem = async (id: string, item: {
  name?: string;
  description?: string;
  tags?: string[];
  location?: string;
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

  if (item.location && item.location !== existingItem.currentLocation) {
    await addLocationHistory(id, item.location);
  }
};

export const addLocationHistory = async (itemId: string, location: string) => {
  const db = await initDb();
  const id = crypto.randomUUID();
  
  await db.add('locationHistory', {
    id,
    itemId,
    location,
    timestamp: new Date().toISOString(),
  });
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
    locationHistory,
  };
};

export const searchItems = async (query: string) => {
  const db = await initDb();
  const items = await db.getAll('items');
  
  if (!query) {
    return items;
  }

  const searchTerms = query.toLowerCase().split(' ');
  return items.filter(item => {
    const searchText = `
      ${item.name.toLowerCase()}
      ${item.description.toLowerCase()}
      ${item.tags.join(' ').toLowerCase()}
    `;
    return searchTerms.every(term => searchText.includes(term));
  });
};

export const exportToCsv = async () => {
  const db = await initDb();
  const items = await db.getAll('items');
  const locationHistories = await db.getAll('locationHistory');

  return items.map(item => {
    const itemLocations = locationHistories
      .filter(lh => lh.itemId === item.id)
      .map(lh => lh.location)
      .join(', ');

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      tags: item.tags.join(', '),
      currentLocation: item.currentLocation || '',
      photos: item.photos.join(', '),
      locationHistory: itemLocations,
      createdAt: item.createdAt,
    };
  });
};
