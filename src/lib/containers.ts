import { getDb } from './db';
import type { Item } from '../types/Item';

export async function getContainerPath(containerId?: string): Promise<string> {
  if (!containerId) return 'Unknown location';
  
  const db = await getDb();
  const path: string[] = [];
  let currentId: string | undefined = containerId;
  
  while(currentId) {
    const tx = db.transaction('items', 'readonly');
    const store = tx.objectStore('items');
    const container = await store.get(currentId) as Item | undefined;
    await tx.done;
    
    if(container?.isContainer) {
      path.unshift(container.name);
      currentId = container.location.containerId;
    } else {
      break;
    }
  }
  
  return path.length > 0 ? path.join(' → ') : 'Unknown location';
}