import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EnrollmentService } from '../../enrollment.service';
import { EnrollmentFilter, EnrollmentResponse } from '../../enrollment.models';

@Component({
  selector: 'app-enrollment-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enrollment-list.html',
  styleUrl: './enrollment-list.css',
})
export class EnrollmentListComponent implements OnInit {
  private enrollmentService = inject(EnrollmentService);

  enrollments = signal<EnrollmentResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  filters: EnrollmentFilter = {
    search: '',
    status: null,
  };

  ngOnInit(): void {
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService.getEnrollments(this.pageNumber(), this.pageSize(), this.filters).subscribe({
      next: (response) => {
        this.enrollments.set(response.items);
        this.totalRecords.set(response.totalRecords);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },

      error: (error) => {
        console.error('Error loading enrollments:', error);
        this.errorMessage.set('Unable to load enrollments.');
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.pageNumber.set(1);
    this.loadEnrollments();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: null,
    };
    this.pageNumber.set(1);
    this.loadEnrollments();
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadEnrollments();
    }
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadEnrollments();
    }
  }
}
