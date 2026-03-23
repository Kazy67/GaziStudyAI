import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { Course } from '../../../core/models/course.model';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment.development';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

interface CourseWeek {
  weekNumber: number;
  topicTr: string;
  topicEn: string;
}

@Component({
  selector: 'app-admin-manage-courses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    CheckboxModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-manage-courses.component.html',
})
export class AdminManageCoursesComponent implements OnInit {
  private courseService = inject(CourseService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  // Signals
  courses = signal<Course[]>([]);
  isCreating = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  selectedFile = signal<File | null>(null);
  editingCourseId = signal<string | null>(null);

  // Form State
  courseForm = signal({
    prefix: '',
    nameTr: '',
    nameEn: '',
    descriptionTr: '',
    descriptionEn: '',
    teacherName: '',
    credits: 3,
    yearLevel: 1,
    allowTheoryQuestions: false,
    allowCodeQuestions: false,
    allowMathQuestions: false,
  });

  courseWeeks = signal<
    { weekNumber: number; topicTr: string; topicEn: string }[]
  >([]);

  ngOnInit() {
    this.loadCourses();
  }

  goToMaterials(courseId: string) {
    this.router.navigate(['/admin/courses', courseId, 'materials']);
  }

  loadCourses() {
    this.isLoading.set(true);
    // Assuming backend returns { data: Course[], success: boolean }
    // Ideally this should use the service
    // For now mocking or assuming service structure matches
    /* 
    this.courseService.getAllCourses().subscribe(...) 
    */
    // Since I don't have the full service implementation detail for getAllCourses return type from the file read earlier (it returned Observable<ServiceResult<Course[]>>), I will stick to that.
    this.courseService.getAllCourses().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.courses.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  toggleCreate() {
    this.isCreating.update((v) => !v); // Toggle
    if (!this.isCreating()) {
      this.resetForm();
    }
  }

  editCourse(course: Course) {
    this.isLoading.set(true);
    // Fetch full course details including weeks before populating
    this.courseService.getCourseById(course.id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.isSuccess && res.data) {
          const fullCourse = res.data;
          this.editingCourseId.set(fullCourse.id);
          this.courseForm.set({
            prefix: fullCourse.prefix || '',
            nameTr: fullCourse.nameTr || '',
            nameEn: fullCourse.nameEn || '',
            descriptionTr: fullCourse.descriptionTr || '',
            descriptionEn: fullCourse.descriptionEn || '',
            teacherName: fullCourse.teacherName || '',
            credits: fullCourse.credits || 3,
            yearLevel: fullCourse.yearLevel || 1,
            allowTheoryQuestions: fullCourse.allowTheoryQuestions ?? false,
            allowCodeQuestions: fullCourse.allowCodeQuestions ?? false,
            allowMathQuestions: fullCourse.allowMathQuestions ?? false,
          });

          this.courseWeeks.set(fullCourse.weeks ? [...fullCourse.weeks] : []);
          this.selectedFile.set(null);
          this.isCreating.set(true); // Open the form view
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Could not fetch course details.',
          });
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Server Error',
          detail: 'An error occurred while fetching course data.',
        });
        console.error(err);
      },
    });
  }

  resetForm() {
    this.editingCourseId.set(null);
    this.courseForm.set({
      prefix: '',
      nameTr: '',
      nameEn: '',
      descriptionTr: '',
      descriptionEn: '',
      teacherName: '',
      credits: 3,
      yearLevel: 1,
      allowTheoryQuestions: false,
      allowCodeQuestions: false,
      allowMathQuestions: false,
    });
    this.courseWeeks.set([]);
    this.selectedFile.set(null);
  }

  // --- Curriculum / Weeks Logic ---

  addWeek() {
    this.courseWeeks.update((weeks) => {
      const nextWeekNum = weeks.length + 1;
      return [...weeks, { weekNumber: nextWeekNum, topicTr: '', topicEn: '' }];
    });
  }

  removeWeek(index: number) {
    this.courseWeeks.update((weeks) => {
      const newWeeks = weeks.filter((_, i) => i !== index);
      // Recalculate numbers
      return newWeeks.map((w, i) => ({ ...w, weekNumber: i + 1 }));
    });
  }

  updateWeek(index: number, field: 'topicTr' | 'topicEn', value: string) {
    this.courseWeeks.update((weeks) => {
      const updated = [...weeks];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  // --- Header / Form Helpers ---

  updateField(field: string, value: any) {
    this.courseForm.update((current: any) => ({ ...current, [field]: value }));
  }

  // Helper for type safety in template
  get formVal() {
    return this.courseForm();
  }

  get isFormValid(): boolean {
    const form = this.courseForm();
    if (!form.prefix || form.prefix.trim() === '' || /\s/.test(form.prefix))
      return false;
    if (!form.nameTr || form.nameTr.trim() === '') return false;
    if (!form.nameEn || form.nameEn.trim() === '') return false;
    return true;
  }

  // --- File Handling ---

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  getImageUrl(imagePath: string | null): string {
    if (imagePath) {
      return `${environment.baseUrl}${imagePath}`;
    }
    return 'assets/images/default-course.jpg'; // Fallback image
  }

  // --- Submission ---

  submitCourse() {
    if (this.isLoading()) return;

    const form = this.courseForm();

    // Basic Validation
    if (!form.prefix || !form.nameTr || !form.nameEn) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in the required fields (Prefix, Name TR/EN).',
      });
      return;
    }

    // Prefix validation (no spaces)
    if (/\s/.test(form.prefix)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Prefix cannot contain spaces.',
      });
      return;
    }

    this.isLoading.set(true);

    const formData = new FormData();
    formData.append('Prefix', form.prefix);
    formData.append('NameTr', form.nameTr);
    formData.append('NameEn', form.nameEn);
    formData.append('DescriptionTr', form.descriptionTr);
    formData.append('DescriptionEn', form.descriptionEn);
    formData.append('TeacherName', form.teacherName);
    formData.append('Credits', form.credits.toString());
    formData.append('YearLevel', form.yearLevel.toString());
    formData.append(
      'AllowTheoryQuestions',
      form.allowTheoryQuestions.toString(),
    );
    formData.append('AllowCodeQuestions', form.allowCodeQuestions.toString());
    formData.append('AllowMathQuestions', form.allowMathQuestions.toString());

    if (this.selectedFile()) {
      formData.append('Image', this.selectedFile()!);
    }

    // CRITICAL: Weeks as JSON string
    formData.append('WeeksJson', JSON.stringify(this.courseWeeks()));

    if (this.editingCourseId()) {
      formData.append('Id', this.editingCourseId()!);
      this.courseService.updateCourse(formData).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Course updated successfully!',
            });
            this.isCreating.set(false);
            this.resetForm();
            this.loadCourses();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error updating course: ' + res.message,
            });
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Server Error',
            detail: 'An unexpected server error occurred.',
          });
          console.error(err);
        },
      });
    } else {
      this.courseService.createCourse(formData).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Course created successfully!',
            });
            this.isCreating.set(false);
            this.resetForm();
            this.loadCourses();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error creating course: ' + res.message,
            });
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Server Error',
            detail: 'An unexpected server error occurred.',
          });
          console.error(err);
        },
      });
    }
  }

  // --- Deletion ---
  deleteCourse(courseId: string) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this course?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.isLoading.set(true);
        this.courseService.deleteCourse(courseId).subscribe({
          next: (res) => {
            this.isLoading.set(false);
            if (res.isSuccess) {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Course deleted successfully!',
              });
              this.loadCourses();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error deleting course: ' + res.message,
              });
            }
          },
          error: (err) => {
            this.isLoading.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Server Error',
              detail: 'An unexpected server error occurred.',
            });
            console.error(err);
          },
        });
      },
    });
  }
}
