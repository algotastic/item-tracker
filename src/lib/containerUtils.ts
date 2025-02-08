import { initDb } from "./db";

export async function updateItemLocation(itemId: string, newContainerId: string) {
  const db = await initDb();
  return db.transaction('rw', db.items, async () => {
    const item = await db.items.get(itemId);
    const newContainer = await db.items.get(newContainerId);

    if (!item || !newContainer) throw new Error("Item or container not found");
    if (item.location.path.includes(itemId)) throw new Error("Circular containment");

    const updatedItem = {
      ...item,
      location: {
        containerId: newContainerId,
        path: [...newContainer.location.path, newContainerId]
      }
    };

    await db.items.put(updatedItem);
    return updatedItem;
  });
}

export async function getFullContainerContents(containerId: string) {
  const db = await initDb();
  return db.items
    .where('location.path')
    .anyOf([containerId])
    .toArray();
} 