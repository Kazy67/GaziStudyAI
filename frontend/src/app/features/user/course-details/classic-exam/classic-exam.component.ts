import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

import { CourseService } from '../../../../core/services/course.service';
import { ExamService } from '../../../../core/services/exam.service';
import {
  ClassicRequest,
  ClassicQuestion,
} from '../../../../core/models/exam.model';

import { CpuSchedulingComponent } from './components/cpu-scheduling/cpu-scheduling.component';
import { BankersAlgorithmComponent } from './components/bankers-algorithm/bankers-algorithm.component';
import { MemoryAllocationComponent } from './components/memory-allocation/memory-allocation.component';
import { GenericTheoryComponent } from './components/generic-theory/generic-theory.component';
import { PageReplacementComponent } from './components/page-replacement/page-replacement.component';

@Component({
  selector: 'app-classic-exam',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ToastModule,
    ButtonModule,
    CpuSchedulingComponent,
    BankersAlgorithmComponent,
    PageReplacementComponent,
    MemoryAllocationComponent,
    GenericTheoryComponent,
  ],
  providers: [MessageService],
  templateUrl: './classic-exam.component.html',
  styleUrls: ['./classic-exam.component.scss'],
})
export class ClassicExamComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private examService = inject(ExamService);
  public translate = inject(TranslateService);
  private messageService = inject(MessageService);

  // State
  currentPhase: 'config' | 'loading' | 'exam' = 'config';
  isGenerating = false;
  courseName: string = '';
  availableWeeks: { id: number; label: string }[] = [];

  // Config
  selectedWeeks: number[] = []; // IDs of selected weeks
  questionCount: number = 3;
  difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
  coursePrefix: string = 'os'; // Derived from course name

  // Exam Data
  questions: ClassicQuestion[] = [];
  submitted: boolean = false;
  isRetaking: boolean = false; // Flag to trigger component reset on retake

  // Scoring
  questionScores: number[] = [];
  finalScore: number | null = null;

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      const courseId = params.get('id');
      if (courseId) {
        this.loadCourse(courseId);
      } else {
        // Fallback for direct route access
        const directId =
          this.route.snapshot.paramMap.get('id') ||
          this.route.snapshot.paramMap.get('courseId');
        if (directId) this.loadCourse(directId);
      }
    });
  }

  loadCourse(id: string) {
    this.courseService.getCourseById(id).subscribe((result) => {
      if (result.isSuccess && result.data) {
        const course = result.data;
        this.courseName =
          this.translate.currentLang === 'tr' ? course.nameTr : course.nameEn;

        // Derive prefix for AI
        // Simple heuristic: if name contains 'Visual' -> vp, else -> os (defaulting for this project context)
        const nameLower = course.nameEn.toLowerCase();
        if (nameLower.includes('visual') || nameLower.includes('görsel')) {
          this.coursePrefix = 'vp';
        } else if (
          nameLower.includes('operating') ||
          nameLower.includes('işletim')
        ) {
          this.coursePrefix = 'os';
        }

        // Map weeks
        this.availableWeeks = course.weeks
          .map((w) => ({
            id: w.weekNumber,
            label: this.translate.currentLang === 'tr' ? w.topicTr : w.topicEn,
          }))
          .sort((a, b) => a.id - b.id);

        // Default select all or first few? Let's select none to force user.
      }
    });
  }

  // Updated: Handle score emitted from children
  onScoreCalculated(score: number, index: number) {
    this.questionScores[index] = score;
    this.recalculateFinalScore();
  }

  recalculateFinalScore() {
    if (this.questionScores.length > 0) {
      const sum = this.questionScores.reduce((a, b) => a + (b || 0), 0);
      this.finalScore = sum / (this.questions.length || 1);
    } else {
      this.finalScore = 0;
    }
  }

  submitExam() {
    this.submitted = true;
  }

  retakeExam() {
    // 1. Reset state
    this.submitted = false;
    this.questionScores = [];
    this.finalScore = null;

    // 2. Trigger component re-initialization
    this.isRetaking = true;
    setTimeout(() => {
      this.isRetaking = false;
    }, 50);
  }

  toggleWeek(weekId: number) {
    if (this.selectedWeeks.includes(weekId)) {
      this.selectedWeeks = this.selectedWeeks.filter((id) => id !== weekId);
    } else {
      this.selectedWeeks.push(weekId);
    }
  }

  startExam() {
    if (this.selectedWeeks.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('WARNING'),
        detail: this.translate.instant('EXAM.SELECT_AT_LEAST_ONE'),
      });
      return;
    }

    this.currentPhase = 'loading';
    this.isGenerating = true;
    this.submitted = false;
    this.questionScores = [];
    this.finalScore = null;

    // Construct request matching backend expected format
    const request: ClassicRequest = {
      coursePrefix: this.coursePrefix,
      weeks: this.selectedWeeks,
      questionCount: this.questionCount,
      difficulty: this.difficulty,
    };

    this.examService
      .generateClassicExam(request)
      .pipe(
        finalize(() => {
          this.isGenerating = false;
        }),
      )
      .subscribe({
        next: (response) => {
          // Handle ServiceResult pattern (isSuccess + data/message)
          if (response.isSuccess && response.data) {
            console.log('Exam generated successfully:', response.data);
            this.questions = response.data;
            this.questionScores = new Array(this.questions.length).fill(0);
            this.currentPhase = 'exam';
          } else {
            this.currentPhase = 'config';
            const failMsg = this.translate.instant('EXAM.GENERATE_FAILED');
            // alert(failMsg + ': ' + (response.message || ''));
            this.messageService.add({
              severity: 'error',
              summary: this.translate.instant('ERROR'),
              detail: failMsg + ': ' + (response.message || ''),
            });
          }
        },
        error: (err) => {
          console.error('Error generating exam:', err);
          this.currentPhase = 'config';
          console.error(err);
          // alert(this.translate.instant('EXAM.AI_SERVICE_ERROR'));
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('ERROR'),
            detail: this.translate.instant('EXAM.AI_SERVICE_ERROR'),
          });
        },
      });
  }
}
