import { Component, OnInit, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ExamService } from '../../../core/services/exam.service';
import { CourseService } from '../../../core/services/course.service';
import { StudentDashboardDto } from '../../../core/models/exam.model';
import { UserProfile } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {
  private examService = inject(ExamService);
  private courseService = inject(CourseService);
  public translate = inject(TranslateService);
  private userService = inject(UserService);

  dashboardData: StudentDashboardDto | null = null;
  courseAverages: any[] = [];
  analyticsData: any = null;
  weakestCourse: any = null;
  loading = true;
  user: UserProfile | null = null;

  ngOnInit() {
    this.loadDashboard();
    this.loadCourseAverages();
    this.loadAnalytics();
    this.userService.currentUser$.subscribe((user) => {
      this.user = user;
    });
  }

  loadDashboard() {
    this.examService.getDashboard().subscribe((res) => {
      if (res.isSuccess && res.data) {
        this.dashboardData = res.data;
      }
      this.loading = false;
    });
  }

  loadCourseAverages() {
    this.courseService.getCourseAverageScore().subscribe((res) => {
      if (res.isSuccess && res.data) {
        this.courseAverages = res.data;
      }
    });
  }

  loadAnalytics() {
    this.examService.getAnalytics().subscribe((res) => {
      if (res.isSuccess && res.data) {
        this.analyticsData = res.data;
        if (this.analyticsData?.coursePerformances?.length > 0) {
          // Sort to find weakest course
          const sorted = [...this.analyticsData.coursePerformances].sort(
            (a, b) => a.averageScore - b.averageScore,
          );
          this.weakestCourse = sorted[0];
        }
      }
    });
  }
}
