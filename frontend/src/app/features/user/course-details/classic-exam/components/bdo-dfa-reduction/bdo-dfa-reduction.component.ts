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
  selector: 'app-bdo-dfa-reduction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bdo-dfa-reduction.component.html',
  styleUrls: ['./bdo-dfa-reduction.component.scss'],
})
export class BdoDfaReductionComponent implements OnChanges {
  @Input() question!: ClassicQuestion;
  @Input() isSubmitted: boolean = false;
  @Output() scoreCalculated = new EventEmitter<number>();

  private examService = inject(ExamService);

  // Reduction State
  // We store the raw string inputs for each group to bind to the input fields
  groupInputs = signal<string[]>(['']);

  // The parsed groups to send to backend (computed or updated on change)
  studentGroups = signal<string[][]>([[]]);

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

  // --- Actions ---

  addGroup() {
    this.groupInputs.update((inputs) => [...inputs, '']);
  }

  removeGroup(index: number) {
    this.groupInputs.update((inputs) => {
      const copy = [...inputs];
      copy.splice(index, 1);
      return copy;
    });
  }

  // Track by index for *ngFor
  trackByFn(index: number, item: any) {
    return index;
  }

  reset() {
    this.groupInputs.set(['']);
    this.studentGroups.set([[]]);
    this.finalScore.set(0);
    this.feedback.set([]);
    this.isLoading.set(false);
  }

  evaluate() {
    this.isLoading.set(true);
    this.feedback.set([]);

    // Parse inputs into string[][]
    const groups = this.groupInputs()
      .map((input) =>
        input
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      )
      .filter((g) => g.length > 0);

    this.studentGroups.set(groups);

    const studentData = {
      groups: groups,
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
