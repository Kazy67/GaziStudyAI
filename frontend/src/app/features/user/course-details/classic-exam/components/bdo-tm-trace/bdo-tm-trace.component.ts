import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  SimpleChanges,
  OnChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassicQuestion } from '../../../../../../core/models/exam.model';
import { ExamService } from '../../../../../../core/services/exam.service';

@Component({
  selector: 'app-bdo-tm-trace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bdo-tm-trace.component.html',
  styleUrls: ['./bdo-tm-trace.component.scss'],
})
export class BdoTmTraceComponent implements OnChanges {
  @Input() question!: ClassicQuestion;
  @Input() isSubmitted: boolean = false;
  @Output() scoreCalculated = new EventEmitter<number>();

  private examService = inject(ExamService);

  // TM State
  // Start with Step 0, State q0, and initial Tape (if present, else empty)
  studentTrace = signal<{ step: number; state: string; tape: string }[]>([
    { step: 0, state: 'q0', tape: '' },
  ]);

  // Results
  finalScore = signal<number>(0);
  feedback = signal<string[]>([]);
  isLoading = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isSubmitted'] && this.isSubmitted) {
      this.evaluate();
    }

    // Reset or initialize when question changes
    if (changes['question']) {
      if (!changes['question'].firstChange) {
        this.reset();
      } else if (this.question?.inputData?.initialTape) {
        // Pre-fill initial tape for Step 0 if provided by backend
        this.studentTrace.update((steps) => {
          const newSteps = [...steps];
          newSteps[0].tape = this.question.inputData.initialTape;
          // Maybe add '*' to show head start if not present, but user prompt says warn user to add it.
          return newSteps;
        });
      }
    }
  }

  get loading() {
    return this.isLoading();
  }

  reset() {
    const initialTape = this.question?.inputData?.initialTape || '';
    this.studentTrace.set([{ step: 0, state: 'q0', tape: initialTape }]);
    this.finalScore.set(0);
    this.feedback.set([]);
    this.isLoading.set(false);
  }

  // --- Actions ---

  addStep() {
    this.studentTrace.update((steps) => {
      const lastStep = steps[steps.length - 1];
      return [
        ...steps,
        { step: lastStep.step + 1, state: '', tape: '' }, // Start with empty or maybe copy previous state/tape?
      ];
    });
  }

  removeStep(index: number) {
    if (index === 0) return; // Usually keep step 0
    this.studentTrace.update((steps) => {
      const copy = [...steps];
      copy.splice(index, 1);
      // Re-calculate step numbers if we want them continuous, or leave as is to show deleted steps?
      // Let's re-number for clarity
      return copy.map((s, i) => ({ ...s, step: i }));
    });
  }

  evaluate() {
    this.isLoading.set(true);
    this.feedback.set([]);

    const studentData = {
      traceSteps: this.studentTrace(),
    };

    this.examService
      .evaluateClassicQuestion({
        visualType: this.question.visualType,
        questionText: this.question.questionText,
        solutionData: this.question.solutionData,
        studentData: studentData,
      })
      .subscribe({
        next: (result) => {
          this.isLoading.set(false);
          if (result.isSuccess && result.data) {
            this.finalScore.set(result.data.score);
            this.feedback.set(result.data.feedback);
            this.scoreCalculated.emit(result.data.score);
          } else {
            this.feedback.set([
              result.message || 'Değerlendirme servisine ulaşılamadı.',
            ]);
            this.scoreCalculated.emit(0);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.feedback.set(['Bir bağlantı hatası oluştu: ' + err.message]);
          this.scoreCalculated.emit(0);
        },
      });
  }
}
