import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminDashboardDto } from '../../../core/models/admin.model';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    ProgressBarModule,
    ButtonModule,
    TagModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  dashboardData: AdminDashboardDto | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;
    this.adminService.getDashboardStatistics().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.dashboardData = res.data;
        } else {
          this.error = res.message || 'Failed to load data';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load dashboard data', err);
        this.error = 'Failed to load dashboard statistics.';
        this.loading = false;
      },
    });
  }

  getScoreColor(
    score: number,
  ):
    | 'success'
    | 'info'
    | 'warn'
    | 'danger'
    | 'secondary'
    | 'contrast'
    | undefined {
    if (score >= 85) return 'success';
    if (score >= 70) return 'info';
    if (score >= 50) return 'warn';
    return 'danger';
  }
}
