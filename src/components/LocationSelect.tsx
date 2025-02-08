import React, { useState, useEffect } from 'react';
import { getRooms, initDb } from '../lib/db';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Item } from '../lib/db';

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

  const loadContainers = async () => {
    const db = await initDb();
    const allContainers = await db.items
      .where('isContainer')
      .equals(true)
      .toArray();

    // Build tree structure
    const buildTree = (parentId?: string): ContainerTree[] => 
      allContainers
        .filter(c => c.location.containerId === parentId)
        .map(container => ({
          id: container.id,
          name: container.name,
          children: buildTree(container.id)
        }));

    setContainerTree(buildTree());
  };

  useEffect(() => {
    loadContainers();
  }, []);

  const renderTree = (nodes: ContainerTree[], level = 0) => (
    <>
      {nodes.map(node => (
        <React.Fragment key={node.id}>
          <option 
            value={node.id}
            style={{ paddingLeft: `${level * 20}px` }}
          >
            {node.name}
          </option>
          {renderTree(node.children, level + 1)}
        </React.Fragment>
      ))}
    </>
  );

  return (
    <div className="space-y-4">
      <div>
        <Label>Container (Required)</Label>
        <Select
          value={selectedContainer || ''}
          onChange={e => onContainerChange(e.target.value || undefined)}
          required
          className="w-full mt-2"
        >
          <option value="">Select container</option>
          {renderTree(containerTree)}
        </Select>
      </div>
    </div>
  );
}
