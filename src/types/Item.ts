import type { Photo } from './Photo';

export interface ItemLocation {
  type: 'container' | 'room';
  containerId?: string; // ID of the container item if type is 'container'
  roomId?: string;     // ID of the room if type is 'room'
  path: string[];      // Path remains for hierarchy tracking
}

export interface Item {
  id: string;
  name: string;
  description: string;
  tags: string[];
  location: ItemLocation;
  photos?: Photo[];
  isContainer: boolean;
  containerType?: 'permanent' | 'temporary';
  createdAt: string;
  version: number;
  lastSynced?: Date;
  insuredValue?: number;
  purchaseDate?: Date;
  serialNumber?: string;
}