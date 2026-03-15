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
  selector: 'app-bdo-grammar-derivation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bdo-grammar-derivation.component.html',
  styleUrls: ['./bdo-grammar-derivation.component.scss'],
})
export class BdoGrammarDerivationComponent implements OnChanges {
  @Input() question!: ClassicQuestion;
  @Input() isSubmitted: boolean = false;
  @Output() scoreCalculated = new EventEmitter<number>();

  private examService = inject(ExamService);

  // Derivation State
  // Generally starts with 'S', but let's check inputData or default to S
  studentSteps = signal<string[]>(['S']);

  // Results
  finalScore = signal<number>(0);
  feedback = signal<string[]>([]);
  isLoading = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isSubmitted'] && this.isSubmitted) {
      this.evaluate();
    }

    if (changes['question'] && !changes['question'].firstChange) {
      this.reset();
    }
  }

  get loading() {
    return this.isLoading();
  }

  reset() {
    // Logic to potentially grab start symbol from question or default 'S'
    this.studentSteps.set(['S']);
    this.finalScore.set(0);
    this.feedback.set([]);
    this.isLoading.set(false);
  }

  // --- Actions ---

  addStep() {
    this.studentSteps.update((steps) => [...steps, '']);
  }

  removeStep(index: number) {
    if (index === 0) return; // Treat first step as immutable start if desired, or allow removing
    this.studentSteps.update((steps) => {
      const copy = [...steps];
      copy.splice(index, 1);
      return copy;
    });
  }

  // Track by index for *ngFor because we are binding to primitive strings in array
  trackByIndex(index: number, obj: any): any {
    return index;
  }

  evaluate() {
    this.isLoading.set(true);
    this.feedback.set([]);

    const studentData = {
      derivationSteps: this.studentSteps(),
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
