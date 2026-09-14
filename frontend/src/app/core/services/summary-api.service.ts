import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  VideoSummary,
  SummariesResponse,
  AppMetricsResponse,
  SummaryStatus,
} from '../models/summary.model';

@Injectable({
  providedIn: 'root',
})
export class SummaryApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getSummaries(
    page = 1,
    limit = 20,
    status?: SummaryStatus | 'ALL',
    search?: string,
  ): Observable<SummariesResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<SummariesResponse>(`${this.baseUrl}/summaries`, {
      params,
    });
  }

  getSummaryById(id: string): Observable<VideoSummary> {
    return this.http.get<VideoSummary>(`${this.baseUrl}/summaries/${id}`);
  }

  createSummary(youtubeUrl: string, promptId?: string): Observable<{ data: VideoSummary; message: string }> {
    const body: Record<string, string> = { youtubeUrl };
    if (promptId) body['promptId'] = promptId;

    return this.http.post<{ data: VideoSummary; message: string }>(
      `${this.baseUrl}/summaries`,
      body,
    );
  }

  retrySummary(id: string): Observable<{ data: VideoSummary; message: string }> {
    return this.http.post<{ data: VideoSummary; message: string }>(
      `${this.baseUrl}/summaries/${id}/retry`,
      {},
    );
  }

  deleteSummary(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(
      `${this.baseUrl}/summaries/${id}`,
    );
  }

  syncToDrive(
    id: string,
  ): Observable<{
    statusCode: number;
    message: string;
    data: { success: boolean; message: string };
  }> {
    return this.http.post<{
      statusCode: number;
      message: string;
      data: { success: boolean; message: string };
    }>(`${this.baseUrl}/summaries/${id}/sync-drive`, {});
  }

  getMetrics(): Observable<AppMetricsResponse> {
    return this.http.get<AppMetricsResponse>(`${this.baseUrl}/metrics`);
  }

  refreshMetrics(): Observable<AppMetricsResponse> {
    return this.http.post<AppMetricsResponse>(
      `${this.baseUrl}/metrics/refresh`,
      {},
    );
  }
}
