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
  selector: 'app-bdo-regex',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bdo-regex.component.html',
  styleUrls: ['./bdo-regex.component.scss'],
})
export class BdoRegexComponent implements OnChanges {
  @Input() question!: ClassicQuestion;
  @Input() isSubmitted: boolean = false;
  @Output() scoreCalculated = new EventEmitter<number>();

  private examService = inject(ExamService);

  studentRegex = signal<string>('');
  finalScore = signal<number>(0);
  feedback = signal<string[]>([]);
  isLoading = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['question'] && this.question) {
      if (this.question.userAnswer) {
        this.studentRegex.set(this.question.userAnswer);
      } else {
        this.reset();
      }
    }

    if (changes['isSubmitted']) {
      if (this.isSubmitted) {
        this.evaluate();
      } else {
        this.reset();
      }
    }
  }

  onAnswerChange() {
    if (this.question) {
      this.question.userAnswer = this.studentRegex();
    }
  }

  evaluate() {
    this.isLoading.set(true);
    this.feedback.set([]);

    const studentData = {
      regex: this.studentRegex(),
    };

    // If empty regex, don't bother asking AI
    if (!this.studentRegex() || this.studentRegex().trim() === '') {
      this.isLoading.set(false);
      this.finalScore.set(0);
      this.feedback.set(['Cevap boş bırakılamaz.']);
      this.scoreCalculated.emit(0);
      return;
    }

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
            this.finalScore.set(0);
            this.feedback.set([
              result.message || 'Değerlendirme servisine ulaşılamadı.',
            ]);
            this.scoreCalculated.emit(0);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.finalScore.set(0);
          this.feedback.set(['Bir bağlantı hatası oluştu.']);
          this.scoreCalculated.emit(0);
        },
      });
  }

  reset() {
    this.studentRegex.set('');
    this.finalScore.set(0);
    this.feedback.set([]);
    this.isLoading.set(false);
  }
}
