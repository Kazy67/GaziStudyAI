import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment.development';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { FileUploadModule } from 'primeng/fileupload';

@Component({
  selector: 'app-course-materials',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    FileUploadModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './course-materials.html',
})
export class CourseMaterials implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  courseId = signal<string>('');
  courseDetails = signal<any>(null);
  materialsStatus = signal<Record<string, string>>({});
  isLoading = signal<boolean>(true);
  uploadingWeek = signal<number | null>(null);
  stagedFiles = signal<Record<number, File>>({});

  // Create a reactive array linking week info with material presence
  // We'll update this list when both endpoints return data
  mergedWeeks = signal<any[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseId.set(id);
      this.loadData();
    }
  }

  loadData() {
    this.isLoading.set(true);

    // 1. Fetch course details
    this.courseService.getCourseById(this.courseId()).subscribe({
      next: (courseRes) => {
        if (courseRes.isSuccess && courseRes.data) {
          this.courseDetails.set(courseRes.data);
          const courseWeeks = courseRes.data.weeks || [];

          // 2. Fetch material status
          this.courseService.getMaterialsStatus(this.courseId()).subscribe({
            next: (matRes) => {
              if (matRes.data) {
                this.materialsStatus.set(matRes.data);
                this.mergeData(courseWeeks, matRes.data);
              } else {
                this.mergeData(courseWeeks, {});
              }
              this.isLoading.set(false);
            },
            error: (err) => {
              console.warn('GetMaterialsStatus returned error status:', err);
              // Sometimes the backend returns 400 Bad Request if python fails or cache hits
              // BUT it still embeds the `data` dictionary in the HttpErrorResponse! Let's extract it:
              const errData = err.error?.data || {};
              this.materialsStatus.set(errData);
              this.mergeData(courseWeeks, errData);
              this.isLoading.set(false);
            },
          });
        } else {
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Could not load course details.',
          });
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Server error while loading course.',
        });
      },
    });
  }

  mergeData(weeks: any[], materialsDict: Record<string, string>) {
    // materialsDict will be an array of "existing weeks" prefixes from the server
    const merged = weeks.map((week) => {
      // The backend expects the material to be stored.
      // The endpoint returns a list of tags. We assume `weekTag` is mapped like `${coursePrefix}_hafta_${weekNumber}`
      const coursePrefix = this.courseDetails().prefix.toLowerCase();
      const expectedTag = `${coursePrefix}_hafta_${week.weekNumber}`;

      const hasMaterial = expectedTag in materialsDict;
      const fileName = hasMaterial ? materialsDict[expectedTag] : null;

      return {
        ...week,
        expectedTag,
        hasMaterial,
        fileName,
      };
    });
    this.mergedWeeks.set(merged);
  }

  goBack() {
    this.router.navigate(['/admin/courses']);
  }

  getImageUrl(imagePath: string | null): string {
    if (imagePath) {
      return `${environment.baseUrl}${imagePath}`;
    }
    return 'assets/images/default-course.jpg';
  }

  onFileSelected(event: Event, weekNumber: number) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validate type: we only want text-heavy (.pdf or .txt)
    const allowed = ['application/pdf', 'text/plain'];
    if (!allowed.includes(file.type)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid File',
        detail: 'Please upload only PDF or TXT files.',
      });
      return;
    }

    // Stage the file instead of immediately uploading
    this.stagedFiles.update((files) => ({
      ...files,
      [weekNumber]: file,
    }));
  }

  cancelStagedFile(weekNumber: number) {
    this.stagedFiles.update((files) => {
      const newFiles = { ...files };
      delete newFiles[weekNumber];
      return newFiles;
    });
  }

  uploadStagedFile(weekNumber: number) {
    const file = this.stagedFiles()[weekNumber];
    if (!file) return;

    this.uploadingWeek.set(weekNumber);
    this.courseService
      .uploadMaterial(this.courseId(), weekNumber, file)
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Material uploaded successfully.',
            });

            this.cancelStagedFile(weekNumber);
            this.uploadingWeek.set(null);
            // Refresh
            this.loadData();
          } else {
            this.uploadingWeek.set(null);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: res.message || 'Upload failed.',
            });
          }
        },
        error: () => {
          this.uploadingWeek.set(null);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Upload error. Please ensure the backend is running.',
          });
        },
      });
  }

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  deleteMaterial(weekTag: string) {
    this.confirmationService.confirm({
      message:
        'Are you sure you want to delete the material for this week? All AI embeddings for this week will be removed.',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.isLoading.set(true);
        this.courseService.deleteMaterial(weekTag).subscribe({
          next: (res) => {
            if (res.isSuccess) {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Material deleted successfully.',
              });
              this.loadData();
            } else {
              this.isLoading.set(false);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: res.message || 'Deletion failed.',
              });
            }
          },
          error: () => {
            this.isLoading.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Server error during deletion.',
            });
          },
        });
      },
    });
  }
}
