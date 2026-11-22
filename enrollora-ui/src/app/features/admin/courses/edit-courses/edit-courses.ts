import { Component , effect, inject, input,output} from '@angular/core';
import { ReactiveFormsModule,FormControl,FormGroup , Validators } from '@angular/forms';
import { CourseService } from '../course.service';
import { SaveCourseRequest } from '../course.models';



@Component({
  imports: [],
  selector: 'app-edit-courses',
  styleUrl: './edit-courses.css',
  templateUrl: './edit-courses.html',
})
export class EditCourses {
  private courseService = inject(CourseService);

  // Receive course details from parent
  course = input<SaveCourseRequest | null>(null);

  // Receive course ID separately
  courseId = input<number | null>(null);

  // Notify parent after successful update
  courseUpdated = output<void>();

  // Edit Course Form
  courseForm = new FormGroup({

    courseName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),

    duration: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),

    fees: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),

    capacity: new FormControl(2, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(2)]
    }),

    isActive: new FormControl(true, {
      nonNullable: true
    })

  });

  constructor() {

    // Watch for selected course changes
    effect(() => {

      const selectedCourse = this.course();

      if (!selectedCourse) {
        return;
      }

      // Populate existing course details
      this.courseForm.patchValue({
        courseName: selectedCourse.courseName,
        duration: selectedCourse.duration,
        fees: selectedCourse.fees,
        capacity: selectedCourse.capacity,
        isActive: selectedCourse.isActive
      });

    });

  }


updateCourse(): void {

  // Check form validation
  if (this.courseForm.invalid) {
    this.courseForm.markAllAsTouched();
    return;
  }

  // Get selected course ID
  const id = this.courseId();

  if (id === null) {
    return;
  }

  // Get updated form values
  const data: SaveCourseRequest = this.courseForm.getRawValue();

  // Call update API
  this.courseService.updateCourse(id, data).subscribe({

    next: (response) => {

      console.log('Updated Course:', response);

      alert('Course updated successfully!');

      // Notify parent component
      this.courseUpdated.emit();

    },

    error: (err) => {

      console.log('Update failed:', err);

      alert('Course update failed!');

    }

  });

}

}
