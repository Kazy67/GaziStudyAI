import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CourseService } from '../../../../core/services/course.service';
import { Course } from '../../../../core/models/course.model';
import { Observable, switchMap, map } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-course-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './course-layout.component.html',
  styleUrls: ['./course-layout.component.scss'],
})
export class CourseLayoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  public translate = inject(TranslateService);
  private readonly translationService = inject(TranslateService);

  course$: Observable<Course> | undefined;
  showFullDescription = signal(false);

  tabs = [
    { label: 'EXAM.MULTIPLE_CHOICE', route: 'multiple-choice' },
    { label: 'EXAM.CLASSIC_QUESTIONS', route: 'classic-questions' },
    { label: 'EXAM.MOCK_MIDTERM', route: 'mock-midterm' },
    { label: 'EXAM.MOCK_FINAL', route: 'mock-final' },
  ];

  ngOnInit() {
    this.course$ = this.route.paramMap.pipe(
      map((params) => params.get('id')),
      switchMap((id) => {
        if (!id) throw new Error('Course ID is required');
        return this.courseService.getCourseById(id);
      }),
      map((result) => result.data!),
    );
  }

  getLocalizedName(course: Course): string {
    return this.translate.currentLang === 'tr' ? course.nameTr : course.nameEn;
  }

  getLocalizedDescription(course: Course): string {
    return this.translate.currentLang === 'tr'
      ? course.descriptionTr
      : course.descriptionEn;
  }

  getImageUrl(imagePath: string | null): string {
    if (imagePath) {
      return `${environment.baseUrl}${imagePath}`;
    }
    return 'assets/images/default-course.jpg'; // Fallback image
  }

  toggleDescription() {
    this.showFullDescription.update((v) => !v);
  }
}
