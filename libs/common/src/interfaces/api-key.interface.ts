export interface ApiKey {
  id: string;
  name: string;
  key: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  isActive: boolean;
} 