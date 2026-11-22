import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EnrollmentResponse } from '../../enrollment.models';
import { EnrollmentService } from '../../enrollment.service';
import { CancellationService } from '../../../admin/cancellation-requests/cancellation.service';
import {
  CancellationResponse,
  CancellationStatus,
} from '../../../admin/cancellation-requests/cancellation.models';

@Component({
  selector: 'app-my-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  styleUrl: './my-enrollments.css',
  templateUrl: './my-enrollments.html',
})
export class MyEnrollments implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly cancellationService = inject(CancellationService);

  // Active view: 'enrollments' or 'cancellations'
  activeTab = signal<'enrollments' | 'cancellations'>('enrollments');

  // Enrollments data
  enrollments = signal<EnrollmentResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  // Cancellation requests data
  cancellations = signal<CancellationResponse[]>([]);
  isCancellationsLoading = signal(false);
  cancellationsError = signal('');
  cancellationPageNumber = signal(1);
  cancellationPageSize = signal(10);
  cancellationTotalRecords = signal(0);
  cancellationTotalPages = signal(0);

  // Cancellation Modal State
  selectedEnrollmentForCancel: EnrollmentResponse | null = null;
  cancellationReason = '';
  isSubmittingCancel = false;

  readonly CancellationStatus = CancellationStatus;

  ngOnInit(): void {
    this.loadEnrollments();
    this.loadMyCancellations();
  }

  setTab(tab: 'enrollments' | 'cancellations'): void {
    this.activeTab.set(tab);
    if (tab === 'enrollments') {
      this.loadEnrollments();
    } else {
      this.loadMyCancellations();
    }
  }

  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getMyEnrollments(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.enrollments.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;
          this.errorMessage.set(
            body?.detail || body?.message || body?.title ||
            'Unable to load your enrollments.',
          );
          this.isLoading.set(false);
        },
      });
  }

  loadMyCancellations(): void {
    this.isCancellationsLoading.set(true);
    this.cancellationsError.set('');

    this.cancellationService
      .getMine(this.cancellationPageNumber(), this.cancellationPageSize())
      .subscribe({
        next: (response) => {
          this.cancellations.set(response.items);
          this.cancellationTotalRecords.set(response.totalRecords);
          this.cancellationTotalPages.set(response.totalPages);
          this.isCancellationsLoading.set(false);
        },
        error: (error) => {
          const body = error?.error;
          this.cancellationsError.set(
            body?.detail || body?.message || 'Unable to load cancellation requests.',
          );
          this.isCancellationsLoading.set(false);
        },
      });
  }

  openCancelModal(enrollment: EnrollmentResponse): void {
    this.selectedEnrollmentForCancel = enrollment;
    this.cancellationReason = '';
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  closeCancelModal(): void {
    this.selectedEnrollmentForCancel = null;
    this.cancellationReason = '';
    this.isSubmittingCancel = false;
  }

  submitCancellation(): void {
    if (!this.selectedEnrollmentForCancel || !this.cancellationReason.trim()) {
      return;
    }

    this.isSubmittingCancel = true;
    const enrollmentId = this.selectedEnrollmentForCancel.enrollmentId;

    this.cancellationService
      .create(enrollmentId, { reason: this.cancellationReason.trim() })
      .subscribe({
        next: () => {
          this.isSubmittingCancel = false;
          this.closeCancelModal();
          this.successMessage.set(
            'Your cancellation request has been submitted successfully and is awaiting administrator review.',
          );
          this.loadEnrollments();
          this.loadMyCancellations();
        },
        error: (error) => {
          this.isSubmittingCancel = false;
          const body = error?.error;
          this.errorMessage.set(
            body?.detail || body?.message || 'Failed to submit cancellation request.',
          );
          this.closeCancelModal();
        },
      });
  }

  // Backend: EnrollmentStatus.Active = 0, Cancelled = 1
  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Cancelled';
  }

  getStatusBadgeClass(status: number): string {
    return status === 0 ? 'active' : 'cancelled';
  }

  getCancellationStatusLabel(status: CancellationStatus): string {
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

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadEnrollments();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadEnrollments();
    }
  }

  previousCancellationPage(): void {
    if (this.cancellationPageNumber() > 1) {
      this.cancellationPageNumber.update((p) => p - 1);
      this.loadMyCancellations();
    }
  }

  nextCancellationPage(): void {
    if (this.cancellationPageNumber() < this.cancellationTotalPages()) {
      this.cancellationPageNumber.update((p) => p + 1);
      this.loadMyCancellations();
    }
  }
}
