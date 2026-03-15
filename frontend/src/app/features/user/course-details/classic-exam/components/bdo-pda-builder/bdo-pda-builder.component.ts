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
  selector: 'app-bdo-pda-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bdo-pda-builder.component.html',
  styleUrls: ['./bdo-pda-builder.component.scss'],
})
export class BdoPdaBuilderComponent implements OnChanges {
  @Input() question!: ClassicQuestion;
  @Input() isSubmitted: boolean = false;
  @Output() scoreCalculated = new EventEmitter<number>();

  private examService = inject(ExamService);

  // PDA State
  studentStates = signal<string[]>(['q0']);
  studentStartState = signal<string>('');
  studentAcceptStates = signal<string[]>([]);
  studentPdaTransitions = signal<
    { from: string; input: string; pop: string; to: string; push: string }[]
  >([]);

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

  addState() {
    const current = this.studentStates();
    const nextQ = `q${current.length}`;
    this.studentStates.update((states) => [...states, nextQ]);
  }

  removeState(index: number) {
    const current = [...this.studentStates()];
    const removedState = current[index];
    current.splice(index, 1);
    this.studentStates.set(current);

    if (this.studentStartState() === removedState)
      this.studentStartState.set('');

    this.studentAcceptStates.update((states) =>
      states.filter((s) => s !== removedState),
    );

    this.studentPdaTransitions.update((trans) =>
      trans.filter((t) => t.from !== removedState && t.to !== removedState),
    );
  }

  toggleAcceptState(state: string) {
    this.studentAcceptStates.update((states) => {
      if (states.includes(state)) {
        return states.filter((s) => s !== state);
      } else {
        return [...states, state];
      }
    });
  }

  addTransition() {
    this.studentPdaTransitions.update((trans) => [
      ...trans,
      { from: '', input: '', pop: '', to: '', push: '' },
    ]);
  }

  removeTransition(index: number) {
    this.studentPdaTransitions.update((trans) => {
      const copy = [...trans];
      copy.splice(index, 1);
      return copy;
    });
  }

  reset() {
    this.studentStates.set(['q0']);
    this.studentStartState.set('');
    this.studentAcceptStates.set([]);
    this.studentPdaTransitions.set([]);
    this.finalScore.set(0);
    this.feedback.set([]);
    this.isLoading.set(false);
  }

  evaluate() {
    this.isLoading.set(true);
    this.feedback.set([]);

    const studentData = {
      states: this.studentStates(),
      startState: this.studentStartState(),
      acceptStates: this.studentAcceptStates(),
      transitions: this.studentPdaTransitions(),
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
