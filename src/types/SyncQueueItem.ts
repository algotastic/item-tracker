export interface SyncQueueItem {
  id: number;
  itemId: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: Date;
  attempts: number;
  lastAttempt?: Date;
  error?: string;
} 