import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditCourses } from './edit-courses';

describe('EditCourses', () => {
  let component: EditCourses;
  let fixture: ComponentFixture<EditCourses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCourses],
    }).compileComponents();

    fixture = TestBed.createComponent(EditCourses);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
