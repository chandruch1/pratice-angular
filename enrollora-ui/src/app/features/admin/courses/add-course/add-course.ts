import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, Validators, FormControl } from '@angular/forms';
import { validate } from '@angular/forms/signals';
import { CourseService } from '../course.service';
import { SaveCourseRequest } from '../course.models';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-add-course',
  styleUrl: './add-course.css',
  templateUrl: './add-course.html',
})
export class AddCourse {

//   export interface SaveCourseRequest {
//   courseName: string;
//   duration: string;
//   fees: number;
//   capacity: number;
//   isActive: boolean;
// }

  private courseService = inject(CourseService);

 

  courseForm = new FormGroup({

  courseName: new FormControl('', {nonNullable: true,
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
    nonNullable: true,validators: [Validators.required, Validators.min(2)]
  }),

  isActive: new FormControl(true, { nonNullable: true})
});

  addCourse() : void {
    if(this.courseForm.invalid){
      this.courseForm.markAllAsTouched();
      return;
    }

    const data : SaveCourseRequest = this.courseForm.getRawValue();
    this.courseService.createCourse(data).subscribe({
      next : (Response)=>{
        console.log(Response);
        alert(`course Added Succesfully`);
      },
      error : (err)=>{
        console.log(err);
        alert(`course added failed`);
      }
    })
  }




}
