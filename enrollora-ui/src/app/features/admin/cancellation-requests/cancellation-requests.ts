import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CancellationService } from './cancellation.service';
import {
  CancellationResponse,
  CancellationStatus,
  CancellationQuery,
  ReviewCancellationRequest,
} from './cancellation.models';

@Component({
  selector: 'app-cancellation-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './cancellation-requests.html',
  styleUrl: './cancellation-requests.css',
})
export class CancellationRequestsComponent implements OnInit, OnDestroy {
  private readonly cancellationService = inject(CancellationService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Cancellation Token / Abort controller for in-flight requests
  private cancelToken$ = new Subject<void>();
  private activeSubscription: Subscription | null = null;
  cancellationTokenActive = signal(false);

  // Data signals
  requests = signal<CancellationResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Pagination signals
  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  // Summary counts
  pendingCount = signal(0);
  approvedCount = signal(0);
  rejectedCount = signal(0);

  // Filters
  filters: CancellationQuery = {
    search: '',
    status: null,
    fromDate: '',
    toDate: '',
  };

  // Status Enum reference for template
  readonly Status = CancellationStatus;

  // Review Modal State
  selectedRequest: CancellationResponse | null = null;
  reviewRemarks = '';
  isReviewing = false;
  reviewAction: 'approve' | 'reject' = 'approve';

  ngOnInit(): void {
    this.loadRequests();
    this.loadSummaryCounts();
  }

  ngOnDestroy(): void {
    this.abortInFlightRequest();
    this.cancelToken$.complete();
  }

  /**
   * Cancel in-flight HTTP request using frontend cancellation token (Abort/Unsubscribe)
   */
  abortInFlightRequest(): void {
    if (this.activeSubscription && !this.activeSubscription.closed) {
      this.cancelToken$.next();
      this.activeSubscription.unsubscribe();
      this.activeSubscription = null;
      this.cancellationTokenActive.set(false);
      this.isLoading.set(false);
      this.errorMessage.set('Request was cancelled by the user via Cancellation Token.');
      this.cdr.markForCheck();
    }
  }

  loadRequests(): void {
    // Abort previous in-flight request if still running
    if (this.activeSubscription && !this.activeSubscription.closed) {
      this.cancelToken$.next();
      this.activeSubscription.unsubscribe();
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.cancellationTokenActive.set(true);

    this.activeSubscription = this.cancellationService
      .getAll(this.pageNumber(), this.pageSize(), this.filters)
      .pipe(takeUntil(this.cancelToken$))
      .subscribe({
        next: (response) => {
          this.requests.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
          this.cancellationTokenActive.set(false);
          this.cdr.markForCheck();
        },
        error: (error) => {
          if (this.cancellationTokenActive()) {
            console.error('Failed to load cancellation requests:', error);
            const body = error?.error;
            this.errorMessage.set(
              body?.detail || body?.message || 'Unable to load cancellation requests.',
            );
            this.isLoading.set(false);
            this.cancellationTokenActive.set(false);
            this.cdr.markForCheck();
          }
        },
      });
  }

  loadSummaryCounts(): void {
    // Fetch counts for summary cards
    this.cancellationService.getAll(1, 1, { status: CancellationStatus.Pending }).subscribe({
      next: (res) => this.pendingCount.set(res.totalRecords),
    });
    this.cancellationService.getAll(1, 1, { status: CancellationStatus.Approved }).subscribe({
      next: (res) => this.approvedCount.set(res.totalRecords),
    });
    this.cancellationService.getAll(1, 1, { status: CancellationStatus.Rejected }).subscribe({
      next: (res) => this.rejectedCount.set(res.totalRecords),
    });
  }

  applyFilters(): void {
    this.pageNumber.set(1);
    this.loadRequests();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: null,
      fromDate: '',
      toDate: '',
    };
    this.pageNumber.set(1);
    this.loadRequests();
  }

  openReviewModal(request: CancellationResponse, action: 'approve' | 'reject'): void {
    this.selectedRequest = request;
    this.reviewAction = action;
    this.reviewRemarks = '';
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  closeReviewModal(): void {
    this.selectedRequest = null;
    this.reviewRemarks = '';
    this.isReviewing = false;
  }

  submitReview(): void {
    if (!this.selectedRequest) return;

    this.isReviewing = true;
    const requestId = this.selectedRequest.cancellationRequestId;
    const body: ReviewCancellationRequest = {
      adminRemarks: this.reviewRemarks.trim() || undefined,
    };

    const reviewObs =
      this.reviewAction === 'approve'
        ? this.cancellationService.approve(requestId, body)
        : this.cancellationService.reject(requestId, body);

    reviewObs.subscribe({
      next: () => {
        this.isReviewing = false;
        this.closeReviewModal();
        this.successMessage.set(
          `Cancellation request #${requestId} was successfully ${this.reviewAction}d.`,
        );
        this.loadRequests();
        this.loadSummaryCounts();
      },
      error: (error) => {
        this.isReviewing = false;
        const body = error?.error;
        this.errorMessage.set(
          body?.detail || body?.message || `Failed to ${this.reviewAction} the cancellation request.`,
        );
        this.closeReviewModal();
      },
    });
  }

  quickApprove(request: CancellationResponse): void {
    if (!confirm(`Are you sure you want to approve cancellation for ${request.studentName} (${request.courseName})?`)) {
      return;
    }

    this.cancellationService.approve(request.cancellationRequestId, {}).subscribe({
      next: () => {
        this.successMessage.set(`Cancellation request #${request.cancellationRequestId} approved.`);
        this.loadRequests();
        this.loadSummaryCounts();
      },
      error: (error) => {
        const body = error?.error;
        this.errorMessage.set(body?.detail || body?.message || 'Failed to approve request.');
      },
    });
  }

  quickReject(request: CancellationResponse): void {
    const remarks = prompt(
      `Enter reason/remarks for rejecting cancellation request #${request.cancellationRequestId}:`,
    );
    if (remarks === null) return; // cancelled

    this.cancellationService
      .reject(request.cancellationRequestId, { adminRemarks: remarks.trim() || undefined })
      .subscribe({
        next: () => {
          this.successMessage.set(`Cancellation request #${request.cancellationRequestId} rejected.`);
          this.loadRequests();
          this.loadSummaryCounts();
        },
        error: (error) => {
          const body = error?.error;
          this.errorMessage.set(body?.detail || body?.message || 'Failed to reject request.');
        },
      });
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((p) => p - 1);
      this.loadRequests();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((p) => p + 1);
      this.loadRequests();
    }
  }

  changePageSize(size: string): void {
    this.pageSize.set(Number(size));
    this.pageNumber.set(1);
    this.loadRequests();
  }

  getStatusLabel(status: CancellationStatus): string {
    switch (status) {
      case CancellationStatus.Pending:
        return 'Pending Review';
      case CancellationStatus.Approved:
        return 'Approved';
      case CancellationStatus.Rejected:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }
}
