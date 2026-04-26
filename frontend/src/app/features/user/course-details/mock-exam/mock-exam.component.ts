import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { CourseService } from '../../../../core/services/course.service';
import { ExamService } from '../../../../core/services/exam.service';
import {
  MockExamRequest,
  MockExamResult,
  SubmitExamDto,
  SubmitQuestionDto,
} from '../../../../core/models/exam.model';
import { MathjaxDirective } from '../../../../shared/directives/mathjax';

// Import all classic exam visual components for reuse in mock exam
import { CpuSchedulingComponent } from '../classic-exam/components/cpu-scheduling/cpu-scheduling.component';
import { BankersAlgorithmComponent } from '../classic-exam/components/bankers-algorithm/bankers-algorithm.component';
import { MemoryAllocationComponent } from '../classic-exam/components/memory-allocation/memory-allocation.component';
import { GenericTheoryComponent } from '../classic-exam/components/generic-theory/generic-theory.component';
import { PageReplacementComponent } from '../classic-exam/components/page-replacement/page-replacement.component';
import { VpCodeCompletionComponent } from '../classic-exam/components/vp-code-completion/vp-code-completion.component';
import { VpSqlQueryComponent } from '../classic-exam/components/vp-sql-query/vp-sql-query.component';
import { BdoRegexComponent } from '../classic-exam/components/bdo-regex/bdo-regex.component';
import { BdoAutomataBuilderComponent } from '../classic-exam/components/bdo-automata-builder/bdo-automata-builder.component';
import { BdoPdaBuilderComponent } from '../classic-exam/components/bdo-pda-builder/bdo-pda-builder.component';
import { BdoTmTraceComponent } from '../classic-exam/components/bdo-tm-trace/bdo-tm-trace.component';
import { BdoGrammarDerivationComponent } from '../classic-exam/components/bdo-grammar-derivation/bdo-grammar-derivation.component';
import { BdoDfaReductionComponent } from '../classic-exam/components/bdo-dfa-reduction/bdo-dfa-reduction.component';
import { GenericMathComponent } from '../classic-exam/components/generic-math/generic-math.component';

@Component({
  selector: 'app-mock-exam',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MathjaxDirective,
    CpuSchedulingComponent,
    BankersAlgorithmComponent,
    MemoryAllocationComponent,
    GenericTheoryComponent,
    PageReplacementComponent,
    VpCodeCompletionComponent,
    VpSqlQueryComponent,
    BdoRegexComponent,
    BdoAutomataBuilderComponent,
    BdoPdaBuilderComponent,
    BdoTmTraceComponent,
    BdoGrammarDerivationComponent,
    BdoDfaReductionComponent,
    GenericMathComponent,
  ],
  templateUrl: './mock-exam.component.html',
})
export class MockExamComponent implements OnInit {
  private courseService = inject(CourseService);
  private examService = inject(ExamService);
  private route = inject(ActivatedRoute);

  courseId = signal<string>(''); // Actual GUID
  coursePrefix = signal<string>(''); // 'vp', 'bdo', etc.

  selectedType = signal<'Vize' | 'Final' | null>(null);
  isGenerating = signal<boolean>(false);
  examData = signal<MockExamResult | null>(null);
  isSubmitted = signal<boolean>(false);

  testAnswers = signal<{ [questionId: string]: string }>({});
  classicAnswers = signal<{ [questionId: string]: string }>({});
  classicScores = signal<{ [questionId: string]: number }>({});
  finalScore = signal<number | null>(null);

  sessionId = crypto.randomUUID();
  attemptNumber = 1;
  submitLoading = signal<boolean>(false);
  pendingEvaluations = 0;

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      const idOrPrefix = params.get('id');
      if (idOrPrefix) {
        this.coursePrefix.set(idOrPrefix);
        this.loadCourseData(idOrPrefix);
      }
    });
  }

  loadCourseData(idOrPrefix: string) {
    // Get actual course GUID using the prefix from URL
    this.courseService.getStudentExamSetup(idOrPrefix).subscribe({
      next: (result) => {
        if (result.isSuccess && result.data?.course?.id) {
          this.courseId.set(result.data.course.id);
        }
      },
      error: (err) => console.error('Failed to load course details', err),
    });
  }

  selectType(type: 'Vize' | 'Final') {
    this.selectedType.set(type);
  }

  generateExam() {
    const type = this.selectedType();
    const cid = this.courseId();
    if (!type || !cid) return;

    this.isGenerating.set(true);
    this.isSubmitted.set(false);
    this.testAnswers.set({});
    this.classicAnswers.set({});
    this.classicScores.set({});
    this.finalScore.set(null);
    this.sessionId = crypto.randomUUID();
    this.attemptNumber = 1;

    const request: MockExamRequest = {
      courseId: cid,
      examType: type,
    };

    this.examService.generateMockExam(request).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.examData.set(res.data);
          console.log('Generated Mock Exam:', res.data);
        } else {
          console.error('Failed to generate mock exam:', res.message);
        }
        this.isGenerating.set(false);
      },
      error: (err) => {
        console.error('Error generating mock exam:', err);
        this.isGenerating.set(false);
      },
    });
  }

  selectOption(questionId: string, answerIndex: string) {
    this.testAnswers.update((current) => ({
      ...current,
      [questionId]: answerIndex,
    }));
  }

  updateClassicAnswer(questionId: string | number, value: string) {
    this.classicAnswers.update((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  isAsyncType(type: string): boolean {
    return (
      type?.startsWith('bdo_') ||
      type?.startsWith('generic_') ||
      type?.startsWith('vp_')
    );
  }

  onClassicScoreCalculated(score: number, questionId: string | number) {
    this.classicScores.update((current) => ({
      ...current,
      [questionId]: score,
    }));

    if (this.isSubmitted() && this.pendingEvaluations > 0) {
      const exam = this.examData();
      const question = exam?.classicQuestions?.find(
        (q) => (q.id || exam.classicQuestions.indexOf(q)) === questionId,
      );

      // Decrease only if it was an async question resolving
      if (question && this.isAsyncType(question.visualType)) {
        this.pendingEvaluations--;
        if (this.pendingEvaluations <= 0) {
          this.pendingEvaluations = 0;
          this.finalizeSubmission();
        }
      }
    }
  }

  submitExam() {
    this.isSubmitted.set(true);
    this.submitLoading.set(true);
    this.pendingEvaluations = 0;

    const exam = this.examData();
    if (exam && exam.classicQuestions) {
      exam.classicQuestions.forEach((q, i) => {
        if (this.isAsyncType(q.visualType)) {
          this.pendingEvaluations++;
        }
      });
    }

    // Wait for a tick so UI updates and child components trigger their evaluations
    if (this.pendingEvaluations === 0) {
      setTimeout(() => {
        this.finalizeSubmission();
      }, 100);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  finalizeSubmission() {
    const exam = this.examData();
    let totalScore = 0;

    const mcCount = exam?.testQuestions?.length || 0;
    const classicCount = exam?.classicQuestions?.length || 0;
    const totalWeight = mcCount * 1 + classicCount * 2;
    const unitPoints = totalWeight > 0 ? 100 / totalWeight : 0;

    const mcPoints = unitPoints * 1;
    const classicPointsMax = unitPoints * 2;

    let mcCorrectCount = 0;
    const submitQuestions: SubmitQuestionDto[] = [];

    // Evaluate MC
    if (exam?.testQuestions) {
      exam.testQuestions.forEach((q: any, i: number) => {
        const qId = q.id || i;
        const selectedOptStr = this.testAnswers()[qId];
        const selectedIdx = parseInt(selectedOptStr, 10);
        const isCorrect =
          !isNaN(selectedIdx) && this.isOptionActuallyCorrect(q, selectedIdx);

        if (isCorrect) {
          mcCorrectCount++;
        }

        submitQuestions.push({
          text: q.question || q.text || `Test Soru ${i + 1}`,
          type: 0, // MultipleChoice
          studentAnswer:
            !isNaN(selectedIdx) && q.options
              ? q.options[selectedIdx]
              : selectedOptStr || '',
          isCorrect: isCorrect,
          inputDataJson: JSON.stringify({ options: q.options || [] }),
          solutionJson: JSON.stringify({ answer: q.answer || '' }),
        });
      });
    }

    totalScore += mcCorrectCount * mcPoints;

    // Evaluate Classic
    if (exam?.classicQuestions) {
      exam.classicQuestions.forEach((cq: any, i: number) => {
        const cqId = cq.id || i;
        const cScore = this.classicScores()[cqId] || 0;
        totalScore += (cScore / 100) * classicPointsMax;

        const rawAnswer =
          cq.userAnswer !== undefined && cq.userAnswer !== null
            ? cq.userAnswer
            : this.classicAnswers()[cqId];
        const studentAnsStr =
          typeof rawAnswer === 'object'
            ? JSON.stringify(rawAnswer)
            : String(rawAnswer || '');

        submitQuestions.push({
          text: cq.questionText || `Klasik Soru ${i + 1}`,
          type: 1, // Classic
          studentAnswer: studentAnsStr,
          isCorrect: cScore >= 50,
          inputDataJson: JSON.stringify(cq.inputData || {}),
          solutionJson: JSON.stringify(cq.solutionData || {}),
        });
      });
    }

    const calculatedScore = Math.round(totalScore * 100) / 100;
    this.finalScore.set(calculatedScore);

    const submitDto: SubmitExamDto = {
      courseId: this.courseId(),
      sessionId: this.sessionId,
      attemptNumber: this.attemptNumber,
      topic: `${this.selectedType()} exam`,
      questionCount: mcCount + classicCount,
      score: calculatedScore,
      difficulty: 'Medium',
      questions: submitQuestions,
    };

    this.examService
      .submitExam(submitDto)
      .pipe(finalize(() => this.submitLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            console.log('Mock exam submitted successfully.', res);
          } else {
            console.error('Failed to submit mock exam.');
          }
        },
        error: (err) => console.error('Error submitting mock exam:', err),
      });
  }

  retakeExam() {
    this.isSubmitted.set(false);
    this.testAnswers.set({});
    this.classicAnswers.set({});
    this.classicScores.set({});
    this.finalScore.set(null);
    this.attemptNumber++;

    // Clear user answers from classic questions array directly so child components reset
    const exam = this.examData();
    if (exam?.classicQuestions) {
      const resetQuestions = exam.classicQuestions.map((q: any) => {
        const { userAnswer, ...rest } = q;
        return { ...rest }; // new object reference, userAnswer stripped
      });
      this.examData.set({ ...exam, classicQuestions: resetQuestions });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetConfig() {
    this.selectedType.set(null);
    this.examData.set(null);
    this.isSubmitted.set(false);
    this.testAnswers.set({});
    this.classicAnswers.set({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isOptionActuallyCorrect(question: any, optIndex: number): boolean {
    if (!question || !question.answer || !question.options) return false;
    const optionText = question.options[optIndex];
    return (
      question.answer.includes(optionText) ||
      optionText.includes(question.answer)
    );
  }

  getTestOptionStyle(
    question: any,
    selectedOptionIndexStr: string,
  ): 'correct' | 'incorrect' | 'neutral' {
    if (!this.isSubmitted()) return 'neutral';

    // Check if THIS option is the correct one overall
    const selectedIdx = parseInt(selectedOptionIndexStr, 10);
    if (
      !isNaN(selectedIdx) &&
      this.isOptionActuallyCorrect(question, selectedIdx)
    ) {
      return 'correct';
    }
    if (
      !isNaN(selectedIdx) &&
      !this.isOptionActuallyCorrect(question, selectedIdx)
    ) {
      return 'incorrect';
    }
    return 'neutral';
  }

  getOptionClass(
    question: any,
    qId: string | number,
    optIndexStr: string,
  ): string {
    const isSelected = this.testAnswers()[qId] === optIndexStr;
    const isCorrectHere = this.isOptionActuallyCorrect(
      question,
      parseInt(optIndexStr, 10),
    );

    if (!this.isSubmitted()) {
      return isSelected
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
        : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800';
    }

    // Exam is submitted: Give immediate visual feedback per option
    if (isCorrectHere) {
      return 'border-green-500 bg-green-50/80 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    }
    if (isSelected && !isCorrectHere) {
      return 'border-red-500 bg-red-50/80 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    }

    return 'border-slate-200 dark:border-slate-700 opacity-60';
  }
}
