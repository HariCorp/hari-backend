export interface Completion {
  id: string;
  prompt: string;
  response: string;
  userId: string;
  apiKeyId: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
} 