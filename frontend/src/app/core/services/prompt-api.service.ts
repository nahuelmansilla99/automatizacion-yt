import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Prompt,
  PromptsResponse,
  CreatePromptPayload,
  UpdatePromptPayload,
  PromptSummariesResponse,
} from '../models/prompt.model';

@Injectable({
  providedIn: 'root',
})
export class PromptApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getPrompts(options?: {
    page?: number;
    limit?: number;
    search?: string;
    tag?: string;
    isActive?: boolean;
  }): Observable<PromptsResponse> {
    let params = new HttpParams()
      .set('page', (options?.page ?? 1).toString())
      .set('limit', (options?.limit ?? 50).toString());

    if (options?.search) {
      params = params.set('search', options.search);
    }
    if (options?.tag) {
      params = params.set('tag', options.tag);
    }
    if (options?.isActive !== undefined) {
      params = params.set('isActive', options.isActive.toString());
    }

    return this.http.get<PromptsResponse>(`${this.baseUrl}/prompts`, { params });
  }

  getPromptById(id: string): Observable<Prompt> {
    return this.http.get<Prompt>(`${this.baseUrl}/prompts/${id}`);
  }

  createPrompt(payload: CreatePromptPayload): Observable<{ statusCode: number; message: string; data: Prompt }> {
    return this.http.post<{ statusCode: number; message: string; data: Prompt }>(
      `${this.baseUrl}/prompts`,
      payload,
    );
  }

  updatePrompt(
    id: string,
    payload: UpdatePromptPayload,
  ): Observable<{ statusCode: number; message: string; data: Prompt }> {
    return this.http.patch<{ statusCode: number; message: string; data: Prompt }>(
      `${this.baseUrl}/prompts/${id}`,
      payload,
    );
  }

  deletePrompt(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/prompts/${id}`);
  }

  setDefault(id: string): Observable<{ statusCode: number; message: string; data: Prompt }> {
    return this.http.post<{ statusCode: number; message: string; data: Prompt }>(
      `${this.baseUrl}/prompts/${id}/set-default`,
      {},
    );
  }

  getSummariesByPrompt(id: string, page = 1, limit = 20): Observable<PromptSummariesResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PromptSummariesResponse>(
      `${this.baseUrl}/prompts/${id}/summaries`,
      { params },
    );
  }
}
