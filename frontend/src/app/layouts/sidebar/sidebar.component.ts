import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Use CommonModule for ngClass, ngIf, etc. if needed
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../core/services/layout.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss', // Changed to scss for consistency
})
export class SidebarComponent {
  layoutService = inject(LayoutService);
  authService = inject(AuthService);
  router = inject(Router);

  get homeLink(): string {
    return this.authService.isAdmin() ? '/admin/dashboard' : '/home';
  }

  studentNavItems = [
    { label: 'Home', icon: 'pi pi-th-large', route: '/home' },
    { label: 'My Courses', icon: 'pi pi-book', route: '/my-courses' },
    {
      label: 'AI Study Room',
      icon: 'pi pi-bolt',
      route: '/ai-study-room',
    },
    { label: 'My History', icon: 'pi pi-history', route: '/history' },
    { label: 'Performance', icon: 'pi pi-chart-line', route: '/performance' },
  ];

  adminNavItems = [
    {
      label: 'Dashboard',
      icon: 'pi pi-objects-column',
      route: '/admin/dashboard',
    },
    { label: 'Manage Courses', icon: 'pi pi-list', route: '/admin/courses' },
    {
      label: 'Student Directory',
      icon: 'pi pi-users',
      route: '/admin/students',
    },
    {
      label: 'AI Logs',
      icon: 'pi pi-server',
      route: '/admin/ai-logs',
    },
  ];

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    this.router.navigate(['/auth/login']);
  }
}
