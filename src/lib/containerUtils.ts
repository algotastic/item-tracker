import { getDb } from "./db";
import type { Item } from "../types/Item";

export async function updateItemLocation(itemId: string, newContainerId: string) {
  const db = await getDb();
  const tx = db.transaction(['items'], 'readwrite');
  
  try {
    const item = await tx.objectStore('items').get(itemId);
    const newContainer = await tx.objectStore('items').get(newContainerId);

    if (!item || !newContainer) throw new Error("Item or container not found");
    if (item.location.path.includes(itemId)) throw new Error("Circular containment");

    const updatedItem: Item = {
      ...item,
      location: {
        ...item.location,
        type: 'container',
        containerId: newContainerId,
        path: [...newContainer.location.path, newContainerId]
      },
      version: item.version + 1
    };

    await tx.objectStore('items').put(updatedItem);
    await tx.done;
    return updatedItem;
  } catch (error) {
    await tx.abort();
    throw error;
  }
}

export async function getFullContainerContents(containerId: string) {
  const db = await getDb();
  const tx = db.transaction('items', 'readonly');
  try {
    const items = await tx.objectStore('items')
      .index('by-path')
      .getAll([containerId]);
    await tx.done;
    return items;
  } catch (error) {
    await tx.abort();
    throw error;
  }
} 