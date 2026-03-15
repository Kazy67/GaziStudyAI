import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ExamService } from '../../../core/services/exam.service';
import { StudentDashboardDto } from '../../../core/models/exam.model';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {
  private examService = inject(ExamService);
  public translate = inject(TranslateService);

  dashboardData: StudentDashboardDto | null = null;
  loading = true;

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.examService.getDashboard().subscribe((res) => {
      if (res.isSuccess && res.data) {
        this.dashboardData = res.data;
      }
      this.loading = false;
    });
  }
}
