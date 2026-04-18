import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';

@Component({
  selector: 'app-exam-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './history.component.html',
})
export class ExamHistoryComponent implements OnInit {
  historyData = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  private examService = inject(ExamService);
  private router = inject(Router);

  ngOnInit(): void {
    this.examService.getStudentExamHistory().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.historyData.set(res.data);
          console.log('Exam history loaded:', res.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load history', err);
        this.isLoading.set(false);
      },
    });
  }

  viewDetails(examId: string) {
    this.router.navigate(['/history', examId]);
  }
}
