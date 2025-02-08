import { Photo } from "./Photo";

export interface ItemLocation {
  containerId: string;
  path: string[];
  coordinates?: {
    x: number;
    y: number;
    z: number;
  };
}

export interface Item {
  id: string;
  name: string;
  description: string;
  tags: string[];
  containerId?: string;
  isContainer: boolean;
  containerType?: 'permanent' | 'temporary';
  location: ItemLocation;
  photos?: Photo[];
  insuredValue?: number;
  purchaseDate?: Date;
  serialNumber?: string;
  createdAt: string;
  version: number;
  lastSynced?: Date;
}