import { initDb } from './db';

export async function getContainerPath(containerId?: string): Promise<string> {
  if (!containerId) return 'Unknown location';
  
  const db = await initDb();
  const path = [];
  let currentId: string | undefined = containerId;
  
  while(currentId) {
    const tx = db.transaction('items', 'readonly');
    const store = tx.objectStore('items');
    const container = await store.get(currentId);
    
    if(container?.isContainer) {
      path.unshift(container.name);
      currentId = container.containerId;
    } else {
      break;
    }
  }
  
  return path.length > 0 ? path.join(' → ') : 'Unknown location';
} 

// Use getAll() through transaction
const items = await db.transaction('items').objectStore('items').getAll(); 