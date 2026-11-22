import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PagedResult } from '../../../shared/models/paged-result.model';
import {
  CancellationQuery,
  CancellationResponse,
  CreateCancellationRequest,
  ReviewCancellationRequest,
} from './cancellation.models';

@Injectable({
  providedIn: 'root',
})
export class CancellationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cancellation-requests`;

  /**
   * Admin: Get all cancellation requests with pagination, filtering, and sorting
   */
  getAll(
    pageNumber = 1,
    pageSize = 10,
    filters?: CancellationQuery,
  ): Observable<PagedResult<CancellationResponse>> {
    const params = this.buildParams(pageNumber, pageSize, filters);
    return this.http.get<PagedResult<CancellationResponse>>(this.apiUrl, { params });
  }

  /**
   * Student: Get my cancellation requests
   */
  getMine(
    pageNumber = 1,
    pageSize = 10,
    filters?: CancellationQuery,
  ): Observable<PagedResult<CancellationResponse>> {
    const params = this.buildParams(pageNumber, pageSize, filters);
    return this.http.get<PagedResult<CancellationResponse>>(`${this.apiUrl}/my`, { params });
  }

  /**
   * Student: Submit a new cancellation request for an active enrollment
   */
  create(enrollmentId: number, request: CreateCancellationRequest): Observable<CancellationResponse> {
    return this.http.post<CancellationResponse>(
      `${environment.apiUrl}/enrollments/${enrollmentId}/cancellation-request`,
      request,
    );
  }

  /**
   * Admin: Approve a cancellation request with optional admin remarks
   */
  approve(id: number, request: ReviewCancellationRequest = {}): Observable<CancellationResponse> {
    return this.http.put<CancellationResponse>(`${this.apiUrl}/${id}/approve`, request);
  }

  /**
   * Admin: Reject a cancellation request with optional admin remarks
   */
  reject(id: number, request: ReviewCancellationRequest = {}): Observable<CancellationResponse> {
    return this.http.put<CancellationResponse>(`${this.apiUrl}/${id}/reject`, request);
  }

  private buildParams(pageNumber: number, pageSize: number, filters?: CancellationQuery): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (filters) {
      if (filters.search?.trim()) {
        params = params.set('search', filters.search.trim());
      }
      if (filters.courseId != null) {
        params = params.set('courseId', filters.courseId);
      }
      if (filters.status != null) {
        params = params.set('status', filters.status);
      }
      if (filters.fromDate) {
        params = params.set('fromDate', filters.fromDate);
      }
      if (filters.toDate) {
        params = params.set('toDate', filters.toDate);
      }
      if (filters.sortBy) {
        params = params.set('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        params = params.set('sortOrder', filters.sortOrder);
      }
    }

    return params;
  }
}
