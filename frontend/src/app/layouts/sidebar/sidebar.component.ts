import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Use CommonModule for ngClass, ngIf, etc. if needed
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss', // Changed to scss for consistency
})
export class SidebarComponent {
  layoutService = inject(LayoutService);

  navItems = [
    { label: 'Home', icon: 'pi pi-th-large', route: '/home' },
    { label: 'My Courses', icon: 'pi pi-book', route: '/my-courses' },
    {
      label: 'AI Study Room',
      icon: 'pi pi-bolt',
      route: '/ai-study-room',
    },
    { label: 'Mock Exams', icon: 'pi pi-file', route: '/mock-exams' },
    { label: 'My History', icon: 'pi pi-history', route: '/history' },
    { label: 'Performance', icon: 'pi pi-chart-line', route: '/performance' },
    { label: 'Settings', icon: 'pi pi-cog', route: '/settings' },
  ];

  logout() {
    console.log('Logging out...');
    // Implement logout logic here
  }
}
