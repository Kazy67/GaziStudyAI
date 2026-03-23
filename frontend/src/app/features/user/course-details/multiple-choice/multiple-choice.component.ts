import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ExamResult,
  Question,
  SubmitExamDto,
} from '../../../../core/models/exam.model';
import { GenerateTestRequest } from '../../../../core/models/test.model';
import { ButtonModule } from 'primeng/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../../../../core/services/course.service';
import { switchMap, map, finalize } from 'rxjs';
import { ExamService } from '../../../../core/services/exam.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

export interface ExamConfig {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  timerEnabled: boolean;
  recommendedTime: number; // in minutes
}

@Component({
  selector: 'app-multiple-choice',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TranslateModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './multiple-choice.component.html',
  styleUrls: ['./multiple-choice.component.scss'],
})
export class MultipleChoiceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private examService = inject(ExamService);
  public translate = inject(TranslateService);
  private messageService = inject(MessageService);

  // Phase 1: Configuration
  weeks: { id: number; topicTr: string; topicEn: string }[] = [];
  validWeeks: number[] = [];
  difficulties = ['Easy', 'Medium', 'Hard'];
  courseName = '';
  courseId = '';
  coursePrefix = '';

  config: ExamConfig = {
    difficulty: 'Medium',
    questionCount: 10,
    timerEnabled: false,
    recommendedTime: 15,
  };
  selectedWeeks: number[] = [];

  // Phase 2: Active Exam
  currentPhase: 'config' | 'exam' | 'grading' = 'config';
  questions: Question[] = [];
  userAnswers: number[] = []; // index of selected option for each question
  timeLeft: number = 0; // in seconds
  timerInterval: any;
  startTime: number = 0;
  timeSpent: number = 0;
  examDate: Date = new Date();
  sessionId: string = '';
  attemptNumber: number = 1;

  // Phase 3: Grading
  loading = false;
  submitLoading = false;
  result: ExamResult | null = null;

  ngOnInit() {
    this.loadCourseWeeks();
    this.calculateRecommendedTime();
  }

  loadCourseWeeks() {
    this.route.parent?.paramMap
      .pipe(
        map((params) => params.get('id')),
        switchMap((id) => {
          if (!id) throw new Error('Course ID is required');
          this.courseId = id;
          return this.courseService.getStudentExamSetup(id);
        }),
      )
      .subscribe({
        next: (result) => {
          if (result.data?.course) {
            console.log('MultipleChoice loadCourseWeeks API result:', result);
            const course = result.data.course;
            this.validWeeks = (result.data.validWeeks || []).map((v: any) =>
              Number(v),
            );
            console.log('Valid weeks array:', this.validWeeks);
            this.courseName = course.nameEn || course.nameTr || '';
            this.coursePrefix = course.prefix || '';
            if (course.weeks) {
              this.weeks = course.weeks
                .map((w: any) => ({
                  id: Number(w.weekNumber),
                  topicTr: w.topicTr,
                  topicEn: w.topicEn,
                }))
                .sort((a: any, b: any) => a.id - b.id);

              console.log('Mapped weeks:', this.weeks);

              // Initialize config with loaded weeks that are actually valid if possible
              if (this.weeks.length > 0) {
                // Initialize default logic could go here or can keep selectedWeeks empty
              }
            }
          }
        },
        error: (err) => console.error('Failed to load course weeks', err),
      });
  }

  toggleWeek(weekId: number) {
    const idx = this.selectedWeeks.indexOf(weekId);
    if (idx > -1) {
      this.selectedWeeks.splice(idx, 1);
    } else {
      this.selectedWeeks.push(weekId);
    }
  }

  getWeekTopic(week: { id: number; topicTr: string; topicEn: string }): string {
    return this.translate.currentLang === 'tr' ? week.topicTr : week.topicEn;
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  calculateRecommendedTime() {
    // Example logic: 1.5 minutes per question
    let time = Math.ceil(this.config.questionCount * 1.5);
    if (time < 2) time = 2;
    if (time > 60) time = 60;
    this.config.recommendedTime = time;
  }

  validateTime() {
    if (this.config.recommendedTime < 2) this.config.recommendedTime = 2;
    if (this.config.recommendedTime > 60) this.config.recommendedTime = 60;
  }

  selectAllTopics() {
    if (this.weeks.length > 0) {
      if (this.selectedWeeks.length === this.validWeeks.length) {
        this.selectedWeeks = []; // Deselect all
      } else {
        this.selectedWeeks = [...this.validWeeks]; // Select all valid
      }
    }
  }

  onTimerToggle() {
    this.calculateRecommendedTime();
  }

  generateExam() {
    this.loading = true;
    this.sessionId = crypto.randomUUID();
    this.attemptNumber = 1;

    // Construct request
    const request: GenerateTestRequest = {
      coursePrefix: this.coursePrefix,
      weeks: [...this.selectedWeeks].sort((a, b) => a - b),
      questionCount: this.config.questionCount,
      difficulty: this.config.difficulty, // Already 'Easy', 'Medium', 'Hard'
    };

    this.examService.generateTest(request).subscribe({
      next: (response) => {
        console.log('Test generated succesffully:', response);
        if (response.isSuccess && response.data) {
          this.questions = response.data.map((q, index) => {
            // Find correct index by comparing answer text
            // The answer in backend is the text, we need to find which option matches it
            const correctIndex = q.options.findIndex((opt) => opt === q.answer);

            return {
              id: `q${index}`,
              text: q.question,
              options: q.options,
              correctOptionIndex: correctIndex !== -1 ? correctIndex : 0, // Fallback to 0 if not found
              topic: '', // Backend doesn't return topic per question yet?
              difficulty: this.config.difficulty,
              explanation: '', // Backend doesn't return explanation yet?
            };
          });

          this.userAnswers = new Array(this.questions.length).fill(-1);
          this.currentPhase = 'exam';
          this.startTime = Date.now();

          if (this.config.timerEnabled) {
            this.startTimer();
          }
        } else {
          console.error('Failed to generate test:', response.message);
          // Handle error (show toast/message)
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('API Error generating test:', err);
        this.loading = false;
        // Handle error
      },
    });
  }

  startTimer() {
    this.timeLeft = this.config.recommendedTime * 60;
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.submitExam(); // Auto submit
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  selectOption(questionIndex: number, optionIndex: number) {
    if (this.currentPhase !== 'exam') return;
    this.userAnswers[questionIndex] = optionIndex;
  }

  submitExam() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.currentPhase = 'grading';
    this.loading = true;
    this.submitLoading = true;
    this.examDate = new Date();
    this.timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

    // Calculate score locally for immediate feedback
    let correct = 0;
    const feedbackTopics = new Set<string>();

    this.questions.forEach((q, i) => {
      if (this.userAnswers[i] === q.correctOptionIndex) {
        correct++;
      } else {
        if (q.topic) feedbackTopics.add(q.topic);
      }
    });

    this.result = {
      score: Math.round((correct / this.questions.length) * 100),
      total: this.questions.length,
      correctAnswers: correct,
      wrongAnswers: this.questions.length - correct,
      feedback: Array.from(feedbackTopics),
    };

    // Prepare DTO for backend
    const submitDto: SubmitExamDto = {
      courseId: this.courseId,
      sessionId: this.sessionId,
      attemptNumber: this.attemptNumber,
      topic: this.courseName,
      questionCount: this.questions.length,
      score: this.result.score,
      difficulty: this.config.difficulty,
      questions: this.questions.map((q, i) => ({
        text: q.text,
        type: 0, // MultipleChoice
        isCorrect: this.userAnswers[i] === q.correctOptionIndex,
        studentAnswer: q.options[this.userAnswers[i]] || '',
        inputDataJson: JSON.stringify({ options: q.options }),
        solutionJson: JSON.stringify({
          answer: q.options[q.correctOptionIndex],
        }),
      })),
    };

    this.examService
      .submitExam(submitDto)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.submitLoading = false;
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Exam submitted successfully!',
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: res.message || 'Failed to submit exam.',
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
    this.loading = true;
    this.result = null;
    this.attemptNumber++;
    this.userAnswers = new Array(this.questions.length).fill(-1);
    this.currentPhase = 'exam';
    this.startTime = Date.now();

    if (this.config.timerEnabled) {
      this.startTimer();
    }
    this.loading = false;
  }

  resetConfig() {
    this.result = null;
    this.currentPhase = 'config';
    this.userAnswers = [];
    this.questions = [];
  }

  getAIAnalysis() {
    // Placeholder for AI Analysis
    console.log('AI Analysis requested');
  }

  // removed mockQuestions method
}
