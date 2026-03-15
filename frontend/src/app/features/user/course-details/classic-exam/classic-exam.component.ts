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
  SubmitExamDto,
  SubmitQuestionDto,
} from '../../../../core/models/exam.model';

import { CpuSchedulingComponent } from './components/cpu-scheduling/cpu-scheduling.component';
import { BankersAlgorithmComponent } from './components/bankers-algorithm/bankers-algorithm.component';
import { MemoryAllocationComponent } from './components/memory-allocation/memory-allocation.component';
import { GenericTheoryComponent } from './components/generic-theory/generic-theory.component';
import { PageReplacementComponent } from './components/page-replacement/page-replacement.component';
import { VpCodeCompletionComponent } from './components/vp-code-completion/vp-code-completion.component';
import { VpSqlQueryComponent } from './components/vp-sql-query/vp-sql-query.component';
import { BdoRegexComponent } from './components/bdo-regex/bdo-regex.component';
import { BdoAutomataBuilderComponent } from './components/bdo-automata-builder/bdo-automata-builder.component';
import { BdoPdaBuilderComponent } from './components/bdo-pda-builder/bdo-pda-builder.component';
import { BdoTmTraceComponent } from './components/bdo-tm-trace/bdo-tm-trace.component';
import { BdoGrammarDerivationComponent } from './components/bdo-grammar-derivation/bdo-grammar-derivation.component';
import { BdoDfaReductionComponent } from './components/bdo-dfa-reduction/bdo-dfa-reduction.component';

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
    VpCodeCompletionComponent,
    VpSqlQueryComponent,
    BdoRegexComponent,
    BdoAutomataBuilderComponent,
    BdoPdaBuilderComponent,
    BdoDfaReductionComponent,
    BdoGrammarDerivationComponent,
    BdoTmTraceComponent,
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
  private readonly translateService = inject(TranslateService);

  // State
  currentPhase: 'config' | 'loading' | 'exam' = 'config';
  isGenerating = false;
  courseName: string = '';
  courseId: string = '';
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
  sessionId: string = '';
  attemptNumber: number = 1;

  // Scoring
  questionScores: number[] = [];
  finalScore: number | null = null;
  submitLoading = false;
  pendingEvaluations = 0;

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      const courseId = params.get('id');
      if (courseId) {
        this.courseId = courseId;
        this.loadCourse(courseId);
      } else {
        // Fallback for direct route access
        const directId =
          this.route.snapshot.paramMap.get('id') ||
          this.route.snapshot.paramMap.get('courseId');
        if (directId) {
          this.courseId = directId;
          this.loadCourse(directId);
        }
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
        const nameLower = course.nameEn.toLowerCase();
        // Check Turkish name too for better matching
        const nameTrLower = (course.nameTr || '').toLowerCase();

        if (nameLower.includes('visual') || nameTrLower.includes('görsel')) {
          this.coursePrefix = 'vp';
        } else if (
          nameLower.includes('operating') ||
          nameTrLower.includes('işletim')
        ) {
          this.coursePrefix = 'os';
        } else if (
          nameLower.includes('formal') ||
          nameLower.includes('automata') ||
          nameTrLower.includes('biçimsel') ||
          nameTrLower.includes('otomata')
        ) {
          this.coursePrefix = 'bdo';
        }

        console.log('Classic Exam Configured for Prefix:', this.coursePrefix);

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
    // Debounce/Check if we were waiting
    if (
      this.submitted &&
      this.pendingEvaluations > 0 &&
      this.isAsyncType(this.questions[index].visualType)
    ) {
      this.pendingEvaluations--;
      if (this.pendingEvaluations <= 0) {
        this.pendingEvaluations = 0;
        this.finalizeSubmission();
      }
    }
  }

  isAsyncType(type: string): boolean {
    // These types are graded by AI asynchronously
    return type?.startsWith('bdo_');
  }

  calculateFinalScore() {
    if (this.questionScores.length > 0) {
      const sum = this.questionScores.reduce((a, b) => a + (b || 0), 0);
      this.finalScore = sum / (this.questions.length || 1);
    } else {
      this.finalScore = 0;
    }
  }

  submitExam() {
    // 1. Trigger submission state first
    this.submitted = true;
    this.pendingEvaluations = 0;

    // 2. Count Async Questions
    this.questions.forEach((q) => {
      if (this.isAsyncType(q.visualType)) {
        this.pendingEvaluations++;
      }
    });

    // 3. If no async questions, submit after tick
    if (this.pendingEvaluations === 0) {
      setTimeout(() => {
        this.finalizeSubmission();
      }, 100);
    }
    // Else wait for onScoreCalculated which will decrement pendingEvaluations
  }

  finalizeSubmission() {
    if (this.submitLoading) return; // Prevent double submit

    this.calculateFinalScore();
    this.submitLoading = true;

    const submitDto: SubmitExamDto = {
      courseId: this.courseId,
      sessionId: this.sessionId,
      attemptNumber: this.attemptNumber,
      topic: this.courseName, // Or derive from weeks
      questionCount: this.questions.length,
      score: this.finalScore || 0,
      difficulty: this.difficulty,
      questions: this.questions.map((q, i) => ({
        text: q.questionText,
        type: 1, // Classic
        isCorrect: (this.questionScores[i] || 0) >= 50, // Threshold for correct? Or just store score? Logic says IsCorrect boolean.
        studentAnswer: JSON.stringify(q.userAnswer),
        inputDataJson: JSON.stringify(q.inputData),
        solutionJson: JSON.stringify(q.solutionData),
      })),
    };

    this.examService
      .submitExam(submitDto)
      .pipe(finalize(() => (this.submitLoading = false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: this.translateService.instant('SUCCESS'),
              detail: this.translateService.instant('EXAM.SUBMIT_SUCCESS'),
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: this.translateService.instant('ERROR'),
              detail: this.translateService.instant('EXAM.SUBMIT_FAILED'),
            });
          }
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to submit exam.',
          });
        },
      });
  }

  retakeExam() {
    // 1. Increment attempt
    this.attemptNumber++;

    // 2. Reset state
    this.submitted = false;
    this.questionScores = new Array(this.questions.length).fill(0);
    this.finalScore = null;

    // 3. Trigger component re-initialization
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
    this.sessionId = crypto.randomUUID(); // Generate new session ID
    this.attemptNumber = 1;

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
