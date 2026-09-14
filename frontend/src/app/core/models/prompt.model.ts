export type PromptStatus = 'active' | 'inactive';

export interface Prompt {
  id: string;
  name: string;
  content: string;
  tags: string[];
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromptsResponse {
  data: Prompt[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePromptPayload {
  name: string;
  content: string;
  tags?: string[];
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdatePromptPayload extends Partial<CreatePromptPayload> {}

export interface PromptSummaryItem {
  id: string;
  youtubeUrl: string;
  videoTitle: string | null;
  channelName: string | null;
  status: 'PENDING' | 'SUCCESS' | 'ERROR';
  createdAt: string;
}

export interface PromptSummariesResponse {
  data: PromptSummaryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
