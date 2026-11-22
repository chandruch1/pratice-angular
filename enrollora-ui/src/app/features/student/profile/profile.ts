import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StudentService } from '../../admin/students/student.service';
import { StudentResponse, UpdateStudentRequest } from '../../admin/students/student.models';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, DecimalPipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class StudentProfileComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  profile = signal<StudentResponse | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  isEditing = signal(false);

  profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    department: ['', [Validators.required, Validators.maxLength(100)]],
    age: [18, [Validators.required, Validators.min(17), Validators.max(60)]],
    cgpa: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.studentService.getMe().subscribe({
      next: (student) => {
        this.profile.set(student);
        this.profileForm.patchValue({
          name: student.name,
          department: student.department,
          age: student.age,
          cgpa: student.cgpa,
        });
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load student profile:', error);
        const body = error?.error;
        this.errorMessage.set(
          body?.detail || body?.message || 'Unable to load profile. Please try again.',
        );
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  startEditing(): void {
    const current = this.profile();
    if (current) {
      this.profileForm.patchValue({
        name: current.name,
        department: current.department,
        age: current.age,
        cgpa: current.cgpa,
      });
    }
    this.isEditing.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  cancelEditing(): void {
    this.isEditing.set(false);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formVal = this.profileForm.value;
    const updateRequest: UpdateStudentRequest = {
      name: formVal.name.trim(),
      email: this.profile()?.email || '',
      department: formVal.department.trim(),
      age: Number(formVal.age),
      cgpa: Number(formVal.cgpa),
    };

    this.studentService.updateMe(updateRequest).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.successMessage.set('Your profile has been updated successfully.');
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isSaving.set(false);
        const body = error?.error;
        this.errorMessage.set(
          body?.detail || body?.message || 'Failed to update profile. Please verify your entries.',
        );
        this.cdr.markForCheck();
      },
    });
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 0:
        return 'Pending Approval';
      case 1:
        return 'Approved';
      case 2:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }
}
