import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MathjaxDirective } from '../../../../../../shared/directives/mathjax';
import { ExamService } from '../../../../../../core/services/exam.service';

@Component({
  selector: 'app-generic-math',
  standalone: true,
  imports: [CommonModule, FormsModule, MathjaxDirective],
  templateUrl: './generic-math.component.html',
})
export class GenericMathComponent implements OnChanges, OnInit {
  @Input() question!: any;
  @Input() isSubmitted: boolean = false;
  @Output() answerChange = new EventEmitter<string>();
  @Output() scoreCalculated = new EventEmitter<number>();

  private examService = inject(ExamService);

  userAnswer: string = '';

  isLoading = signal<boolean>(false);
  finalScore = signal<number | null>(null);
  feedback = signal<string[]>([]);

  ngOnInit() {
    if (this.question?.userAnswer) {
      this.userAnswer = this.question.userAnswer;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['question'] && this.question) {
      this.userAnswer = this.question.userAnswer || '';
      this.finalScore.set(null);
      this.feedback.set([]);
    }
    if (changes['isSubmitted']) {
      if (this.isSubmitted) {
        this.evaluate();
      } else {
        this.userAnswer = '';
        this.finalScore.set(null);
        this.feedback.set([]);
      }
    }
  }

  onAnswerChange() {
    if (this.question) {
      this.question.userAnswer = this.userAnswer;
    }
    this.answerChange.emit(this.userAnswer);
  }

  evaluate() {
    this.isLoading.set(true);
    this.feedback.set([]);

    const studentData = {
      answer: this.userAnswer,
    };

    this.examService
      .evaluateClassicQuestion({
        visualType: 'generic_math',
        questionText: this.question.questionText,
        solutionData: this.question.solutionData,
        studentData: studentData,
      })
      .subscribe({
        next: (result: any) => {
          this.isLoading.set(false);
          if (result.isSuccess && result.data) {
            this.finalScore.set(result.data.score);
            this.feedback.set(result.data.feedback);
            this.scoreCalculated.emit(result.data.score);
          } else {
            this.feedback.set([result.message || 'Değerlendirme alınamadı.']);
            this.scoreCalculated.emit(0);
          }
        },
        error: (err: any) => {
          this.isLoading.set(false);
          this.feedback.set(['Bağlantı hatası: ' + err.message]);
          this.scoreCalculated.emit(0);
        },
      });
  }
}
