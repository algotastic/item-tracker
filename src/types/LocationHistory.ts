export interface LocationHistory {
  id: string;
  itemId: string;
  fromPath: string[];
  toPath: string[];
  timestamp: string;
  context?: string;
} 