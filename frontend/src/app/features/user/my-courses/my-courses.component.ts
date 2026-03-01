import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { TranslationService } from '../../../core/services/translation.service';
import { Course } from '../../../core/models/course.model';

interface YearGroup {
  id: number;
  translationKey: string;
  courses: Course[];
}

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterModule],
  templateUrl: './my-courses.component.html',
  styleUrl: './my-courses.component.scss',
})
export class MyCoursesComponent implements OnInit {
  // We'll manage 4 distinct years
  years = signal<YearGroup[]>([
    { id: 1, translationKey: 'COURSE.YEAR_1', courses: [] },
    { id: 2, translationKey: 'COURSE.YEAR_2', courses: [] },
    { id: 3, translationKey: 'COURSE.YEAR_3', courses: [] },
    { id: 4, translationKey: 'COURSE.YEAR_4', courses: [] },
  ]);

  currentLang = signal<'en' | 'tr'>('tr');

  constructor(
    private courseService: CourseService,
    private translationService: TranslationService,
  ) {}

  ngOnInit(): void {
    // Subscribe to language changes
    this.translationService.currentLang$.subscribe((lang) => {
      this.currentLang.set(lang);
    });

    this.loadCourses();
  }

  loadCourses() {
    this.courseService.getAllCourses().subscribe({
      next: (result) => {
        if (result.isSuccess && result.data) {
          const courses = result.data;

          // Group courses by year
          const updatedYears = this.years().map((yearGroup) => {
            return {
              ...yearGroup,
              courses: courses.filter((c) => c.yearLevel === yearGroup.id),
            };
          });

          this.years.set(updatedYears);
        }
      },
      error: (err) => {
        console.error('Failed to load courses', err);
      },
    });
  }

  getCourseName(course: Course): string {
    return this.currentLang() === 'en' ? course.nameEn : course.nameTr;
  }
}
