import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamResult, Question } from '../../../../core/models/exam.model';
import { GenerateTestRequest } from '../../../../core/models/test.model';
import { ButtonModule } from 'primeng/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../../../../core/services/course.service';
import { switchMap, map } from 'rxjs';
import { ExamService } from '../../../../core/services/exam.service';

export interface ExamConfig {
  startWeek: number;
  endWeek: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  timerEnabled: boolean;
  recommendedTime: number; // in minutes
}

@Component({
  selector: 'app-multiple-choice',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TranslateModule],
  templateUrl: './multiple-choice.component.html',
  styleUrls: ['./multiple-choice.component.scss'],
})
export class MultipleChoiceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private examService = inject(ExamService);
  public translate = inject(TranslateService);

  // Phase 1: Configuration
  weeks: { id: number; topicTr: string; topicEn: string }[] = [];
  difficulties = ['Easy', 'Medium', 'Hard'];
  courseName = '';

  config: ExamConfig = {
    startWeek: 1,
    endWeek: 14,
    difficulty: 'Medium',
    questionCount: 10,
    timerEnabled: false,
    recommendedTime: 15,
  };

  // Phase 2: Active Exam
  currentPhase: 'config' | 'exam' | 'grading' = 'config';
  questions: Question[] = [];
  userAnswers: number[] = []; // index of selected option for each question
  timeLeft: number = 0; // in seconds
  timerInterval: any;
  startTime: number = 0;
  timeSpent: number = 0;
  examDate: Date = new Date();

  // Phase 3: Grading
  loading = false;
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
          return this.courseService.getCourseById(id);
        }),
      )
      .subscribe({
        next: (result) => {
          if (result.data) {
            this.courseName = result.data.nameEn || result.data.nameTr || '';
            if (result.data.weeks) {
              this.weeks = result.data.weeks
                .map((w) => ({
                  id: w.weekNumber,
                  topicTr: w.topicTr,
                  topicEn: w.topicEn,
                }))
                .sort((a, b) => a.id - b.id);

              // Initialize config with loaded weeks
              if (this.weeks.length > 0) {
                this.config.startWeek = this.weeks[0].id;
                this.config.endWeek = this.weeks[this.weeks.length - 1].id;
              }
            }
          }
        },
        error: (err) => console.error('Failed to load course weeks', err),
      });
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

  onStartWeekChange() {
    if (this.config.endWeek < this.config.startWeek) {
      this.config.endWeek = this.config.startWeek;
    }
  }

  selectAllTopics() {
    if (this.weeks.length > 0) {
      this.config.startWeek = this.weeks[0].id;
      this.config.endWeek = this.weeks[this.weeks.length - 1].id;
    }
  }

  onTimerToggle() {
    this.calculateRecommendedTime();
  }

  generateExam() {
    this.loading = true;

    // Define course prefix based on course name or other logic
    const prefix =
      this.courseName.toLowerCase().includes('operating') ||
      this.courseName.toLowerCase().includes('işletim')
        ? 'os'
        : 'vp';

    // Construct request
    const request: GenerateTestRequest = {
      coursePrefix: prefix,
      weeks: Array.from(
        {
          length:
            Number(this.config.endWeek) - Number(this.config.startWeek) + 1,
        },
        (_, i) => Number(this.config.startWeek) + i,
      ),
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
    this.examDate = new Date();
    this.timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

    // Simulate grading
    setTimeout(() => {
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
      this.loading = false;
    }, 1500);
  }

  retakeExam() {
    this.loading = true;
    this.result = null;
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
