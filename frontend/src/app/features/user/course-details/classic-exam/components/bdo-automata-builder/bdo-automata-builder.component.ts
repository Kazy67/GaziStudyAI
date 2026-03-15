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
  selector: 'app-bdo-automata-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bdo-automata-builder.component.html',
  styleUrls: ['./bdo-automata-builder.component.scss'],
})
export class BdoAutomataBuilderComponent implements OnChanges {
  @Input() question!: ClassicQuestion;
  @Input() isSubmitted: boolean = false;
  @Output() scoreCalculated = new EventEmitter<number>();

  private examService = inject(ExamService);

  // Automata State
  studentStates = signal<string[]>(['q0']);
  studentStartState = signal<string>('');
  studentAcceptStates = signal<string[]>([]);
  studentTransitions = signal<{ from: string; input: string; to: string }[]>(
    [],
  );

  // Results
  finalScore = signal<number>(0);
  feedback = signal<string[]>([]);
  isLoading = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isSubmitted'] && this.isSubmitted) {
      this.evaluate();
    }

    // Reset if question changes (retake logic)
    if (changes['question'] && !changes['question'].firstChange) {
      this.reset();
    }
  }

  // Method needed for template to display spinner if desired
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

    // Cleanup dangling references
    if (this.studentStartState() === removedState)
      this.studentStartState.set('');

    this.studentAcceptStates.update((states) =>
      states.filter((s) => s !== removedState),
    );

    this.studentTransitions.update((trans) =>
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
    this.studentTransitions.update((trans) => [
      ...trans,
      { from: '', input: '', to: '' },
    ]);
  }

  removeTransition(index: number) {
    this.studentTransitions.update((trans) => {
      const copy = [...trans];
      copy.splice(index, 1);
      return copy;
    });
  }

  reset() {
    this.studentStates.set(['q0']);
    this.studentStartState.set('');
    this.studentAcceptStates.set([]);
    this.studentTransitions.set([]);
    this.finalScore.set(0);
    this.feedback.set([]);
    this.isLoading.set(false);
  }

  evaluate() {
    this.isLoading.set(true);
    this.feedback.set([]); // Clear previous

    const studentData = {
      states: this.studentStates(),
      startState: this.studentStartState(),
      acceptStates: this.studentAcceptStates(),
      transitions: this.studentTransitions(),
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
