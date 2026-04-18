import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';

export interface QuestionReviewDto {
  id: string;
  text: string;
  type: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean;
  inputDataJson?: string;
  solutionJson?: string;
}

export interface ExamReviewDetailDto {
  id: string;
  courseName: string;
  createdDate: string | Date;
  score: number;
  difficulty: string;
  questions: QuestionReviewDto[];
}

@Component({
  selector: 'app-history-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-detail.component.html',
})
export class HistoryDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private examService = inject(ExamService);

  examId = signal<string | null>(null);
  reviewDetail = signal<ExamReviewDetailDto | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('examId');
    if (id) {
      this.examId.set(id);
      this.loadExamDetail(id);
    } else {
      this.errorMessage.set('Sınav ID bulunamadı.');
      this.isLoading.set(false);
    }
  }

  loadExamDetail(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.examService.getExamReview(id).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.reviewDetail.set(res.data);
          console.log('Exam review detail loaded:', res.data);
        } else {
          this.errorMessage.set(res.message || 'Failed to get exam details.');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching exam review', err);
        this.errorMessage.set('Connection error occurred.');
        this.isLoading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/history']);
  }

  getOptionClasses(
    question: QuestionReviewDto,
    optionKey: string,
    optionValue: string | undefined,
  ): any {
    if (!optionValue) return {};

    const isSelected =
      question.studentAnswer === optionKey ||
      question.studentAnswer === optionValue;
    const isCorrect =
      question.correctAnswer === optionKey ||
      question.correctAnswer === optionValue;

    return {
      'ring-2 ring-green-500 bg-green-50 dark:bg-green-500/10 border-transparent text-green-800 dark:text-green-300':
        isCorrect,
      'ring-2 ring-red-500 bg-red-50 dark:bg-red-500/10 border-transparent text-red-800 dark:text-red-300':
        isSelected && !isCorrect,
      'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300':
        !isCorrect && !isSelected,
      'opacity-50 grayscale':
        !isCorrect && !isSelected && question.studentAnswer,
    };
  }

  isOptionSelected(
    question: QuestionReviewDto,
    optionValue: string | undefined,
  ): boolean {
    if (!optionValue) return false;
    return (
      question.studentAnswer === optionValue ||
      question.studentAnswer?.startsWith(optionValue.substring(0, 2))
    );
  }

  isOptionCorrect(
    question: QuestionReviewDto,
    optionValue: string | undefined,
  ): boolean {
    if (!optionValue) return false;
    return (
      question.correctAnswer === optionValue ||
      question.correctAnswer?.startsWith(optionValue.substring(0, 2))
    );
  }

  formatSolution(jsonString?: string): string {
    if (!jsonString) return '';
    try {
      const obj = JSON.parse(jsonString);
      return this.formatJsonValue(obj, 0);
    } catch {
      return jsonString;
    }
  }

  private formatJsonValue(value: any, indentLevel: number): string {
    if (value === null || value === undefined) return '';
    const spaces = '   '.repeat(indentLevel);

    if (Array.isArray(value)) {
      if (value.length === 0) return 'None';
      // simple array
      if (typeof value[0] !== 'object') {
        return value.join(', ');
      }
      // array of objects
      return (
        '\n' +
        value
          .map(
            (item, i) =>
              `${spaces} ${i + 1}. ${this.formatJsonValue(item, indentLevel + 1).trim()}`,
          )
          .join('\n')
      );
    } else if (typeof value === 'object') {
      return Object.entries(value)
        .map(([k, v]) => {
          // Add space before capital letters and capitalize first letter
          const formattedKey = k
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
          let formattedVal = this.formatJsonValue(v, indentLevel + 1);

          if (typeof v === 'object' && v !== null) {
            return `${spaces}• ${formattedKey}:${formattedVal}`;
          }
          return `${spaces}• ${formattedKey}: ${formattedVal}`;
        })
        .join('\n');
    }
    return String(value);
  }
}
