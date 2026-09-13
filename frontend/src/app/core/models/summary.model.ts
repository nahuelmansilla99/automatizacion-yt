export type SummaryStatus = 'PENDING' | 'SUCCESS' | 'ERROR';

export interface VideoSummary {
  id: string;
  youtubeUrl: string;
  videoTitle: string | null;
  channelName: string | null;
  transcript?: string | null;
  markdownContent: string | null;
  status: SummaryStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SummariesResponse {
  data: VideoSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SupadataAccountInfo {
  organizationId: string;
  plan: string;
  maxCredits: number;
  usedCredits: number;
  remainingCredits: number;
  cachedAt: string;
}

export interface AppMetricsResponse {
  supadata: SupadataAccountInfo | null;
  summaries: {
    total: number;
    pending: number;
    success: number;
    error: number;
  };
}
