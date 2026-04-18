import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables,
} from 'ng2-charts';
import { ExamService } from '../../../core/services/exam.service';

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './performance.component.html',
  providers: [DatePipe],
})
export class PerformanceComponent implements OnInit {
  private examService = inject(ExamService);
  private datePipe = inject(DatePipe);

  isLoading = signal<boolean>(true);
  analyticsData = signal<any>(null);

  timelineChartData = signal<any>(null);
  courseChartData = signal<any>(null);

  chartOptions = signal<any>({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#e5e7eb' },
      },
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af' },
        grid: { color: '#374151', display: false },
      },
      y: {
        ticks: { color: '#9ca3af' },
        grid: { color: '#374151', borderDash: [5, 5] },
        beginAtZero: true,
        max: 100,
      },
    },
  });

  ngOnInit(): void {
    this.examService.getAnalytics().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.analyticsData.set(res.data);
          this.mapChartData(res.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching analytics:', err);
        this.isLoading.set(false);
      },
    });
  }

  private mapChartData(data: any): void {
    // 1. Timeline Chart Mapping
    if (data.scoreTimeline && data.scoreTimeline.length > 0) {
      const labels = data.scoreTimeline.map(
        (t: any) => this.datePipe.transform(t.examDate, 'dd MMM') || '',
      );
      const scores = data.scoreTimeline.map((t: any) => t.score);

      this.timelineChartData.set({
        labels: labels,
        datasets: [
          {
            label: 'Exam Scores (Sınav Puanları)',
            data: scores,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.2)', // Semi-transparent Cyan
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#06b6d4',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#06b6d4',
          },
        ],
      });
    }

    // 2. Course Chart Mapping
    if (data.coursePerformances && data.coursePerformances.length > 0) {
      const courseLabels = data.coursePerformances.map(
        (c: any) => c.courseName,
      );
      const avgScores = data.coursePerformances.map((c: any) => c.averageScore);

      this.courseChartData.set({
        labels: courseLabels,
        datasets: [
          {
            label: 'Average Score (Ortalama Puan)',
            data: avgScores,
            backgroundColor: '#8b5cf6', // Vibrant Purple
            hoverBackgroundColor: '#a78bfa',
            borderRadius: 6,
            barThickness: 30,
          },
        ],
      });
    }
  }
}
