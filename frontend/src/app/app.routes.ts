import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './core/guard/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email.component').then(
        (m) => m.VerifyEmailComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/user/home-page/home-page.component').then(
            (m) => m.HomePageComponent,
          ),
      },
      {
        path: 'course/:id',
        loadComponent: () =>
          import('./features/user/course-details/course-layout/course-layout.component').then(
            (m) => m.CourseLayoutComponent,
          ),
        children: [
          { path: '', redirectTo: 'multiple-choice', pathMatch: 'full' },
          {
            path: 'multiple-choice',
            loadComponent: () =>
              import('./features/user/course-details/multiple-choice/multiple-choice.component').then(
                (m) => m.MultipleChoiceComponent,
              ),
          },
          {
            path: 'classic-questions',
            loadComponent: () =>
              import('./features/user/course-details/classic-exam/classic-exam.component').then(
                (m) => m.ClassicExamComponent,
              ),
          },
          {
            path: 'mock-midterm',
            loadComponent: () =>
              import('./features/user/course-details/mock-exam/mock-exam.component').then(
                (m) => m.MockExamComponent,
              ),
          },
          {
            path: 'mock-final',
            loadComponent: () =>
              import('./features/user/course-details/mock-exam/mock-exam.component').then(
                (m) => m.MockExamComponent,
              ),
          },
        ],
      },
      {
        path: 'ai-study-room',
        loadComponent: () =>
          import('./features/user/study-room/study-room.component').then(
            (m) => m.StudyRoomComponent,
          ),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/user/history/history.component').then(
            (m) => m.ExamHistoryComponent,
          ),
      },
      {
        path: 'history/:examId',
        loadComponent: () =>
          import('./features/user/history-detail/history-detail.component').then(
            (m) => m.HistoryDetailComponent,
          ),
      },
      {
        path: 'performance',
        loadComponent: () =>
          import('./features/user/performance/performance.component').then(
            (m) => m.PerformanceComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/user/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'my-courses',
        loadComponent: () =>
          import('./features/user/my-courses/my-courses.component').then(
            (m) => m.MyCoursesComponent,
          ),
      },
      // Admin Routes
      {
        path: 'admin/dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'admin/courses',
        loadComponent: () =>
          import('./features/admin/manage-courses/admin-manage-courses.component').then(
            (m) => m.AdminManageCoursesComponent,
          ),
      },
      {
        path: 'admin/courses/:id/materials',
        loadComponent: () =>
          import('./features/admin/course-materials/course-materials').then(
            (m) => m.CourseMaterials,
          ),
      },
      {
        path: 'admin/students',
        loadComponent: () =>
          import('./features/admin/students/students.component').then(
            (m) => m.StudentsComponent,
          ),
      },
      {
        path: 'admin/ai-logs',
        loadComponent: () =>
          import('./features/admin/ai-logs/ai-logs.component').then(
            (m) => m.AiLogsComponent,
          ),
      },
      {
        path: 'admin/ai-settings',
        redirectTo: 'admin/dashboard',
      },
    ],
  },
  { path: '**', redirectTo: 'register' },
];
