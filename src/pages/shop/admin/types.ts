
export type ApiConnectionType = 'zapier' | 'n8n' | 'ghl' | 'other';

export interface ApiConnection {
  id: string;
  name: string;
  key: string;
  type: ApiConnectionType;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiConnectionFormData {
  name: string;
  key: string;
  type: ApiConnectionType;
  url?: string;
}
