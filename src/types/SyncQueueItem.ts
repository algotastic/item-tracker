export interface SyncQueueItem {
  id: string;
  itemId: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: Date;
  attempts: number;
  lastAttempt?: Date;
  error?: string;
} 