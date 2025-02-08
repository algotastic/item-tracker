import React, { useState, useEffect } from 'react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getDb } from '../lib/db';
import type { Item } from '../types/Item';

interface LocationSelectProps {
  selectedContainer?: string;
  onContainerChange: (containerId?: string) => void;
}

interface ContainerTree {
  id: string;
  name: string;
  children: ContainerTree[];
}

export default function LocationSelect({
  selectedContainer,
  onContainerChange
}: LocationSelectProps) {
  const [containerTree, setContainerTree] = useState<ContainerTree[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadContainers = async () => {
    const db = await getDb();
    const tx = db.transaction('items', 'readonly');
    
    try {
      const store = tx.objectStore('items');
      const index = store.index('by-is-container');
      const items = await index.getAll(1) as Item[];
      await tx.done;

      // Build tree structure
      const buildTree = (parentId?: string): ContainerTree[] => 
        items
          .filter(c => c.location.containerId === parentId)
          .map(container => ({
            id: container.id,
            name: container.name,
            children: buildTree(container.id)
          }));

      setContainerTree(buildTree());
    } catch (error) {
      console.error('Error loading containers:', error);
      setError('Failed to load containers');
    }
  };

  useEffect(() => {
    loadContainers();
  }, []);

  const renderTree = (nodes: ContainerTree[], level = 0): JSX.Element[] => 
    nodes.flatMap(node => [
      <SelectItem key={node.id} value={node.id}>
        {'  '.repeat(level) + node.name}
      </SelectItem>,
      ...renderTree(node.children, level + 1)
    ]);

  if (error) {
    return (
      <div className="text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Container (Required)</Label>
        <Select
          value={selectedContainer || ''}
          onValueChange={value => onContainerChange(value || undefined)}
        >
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="Select container" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {renderTree(containerTree)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
