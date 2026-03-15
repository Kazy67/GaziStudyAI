import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './core/guard/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'register', pathMatch: 'full' },
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
        redirectTo: 'admin/dashboard',
      },
      {
        path: 'admin/students',
        redirectTo: 'admin/dashboard',
      },
      {
        path: 'admin/ai-settings',
        redirectTo: 'admin/dashboard',
      },
    ],
  },
  { path: '**', redirectTo: 'register' },
];
