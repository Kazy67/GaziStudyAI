import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-generic-theory',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './generic-theory.component.html',
})
export class GenericTheoryComponent implements OnInit, OnChanges {
  @Input() question: any;
  @Input() isSubmitted: boolean = false;
  @Output() scoreCalculated = new EventEmitter<number>();

  userAnswer: string = '';

  // Results
  foundKeywords: string[] = [];
  missedKeywords: string[] = [];
  score: number = 0;

  constructor() {}

  ngOnInit() {
    this.userAnswer = this.question?.userAnswer || '';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['question'] && this.question) {
      this.resetState();
      this.userAnswer = this.question.userAnswer || '';
    }
    if (changes['isSubmitted']) {
      if (this.isSubmitted) {
        this.calculateScore();
      } else {
        this.resetState();
      }
    }
  }

  onAnswerChange() {
    if (this.question) {
      this.question.userAnswer = this.userAnswer;
    }
  }

  resetState() {
    this.userAnswer = '';
    this.foundKeywords = [];
    this.missedKeywords = [];
    this.score = 0;
  }

  calculateScore() {
    // If no keywords defined, give full points assuming manual review or fallback
    const requiredKeywords = this.question?.solutionData?.keywordsRequired;

    if (!requiredKeywords || requiredKeywords.length === 0) {
      // Fallback: simple length check or just give non-zero
      this.score = this.userAnswer.length > 10 ? 100 : 0;
      this.scoreCalculated.emit(this.score);
      return;
    }

    const normalizedAnswer = this.userAnswer.toLowerCase();

    this.foundKeywords = [];
    this.missedKeywords = [];

    let matchCount = 0;

    requiredKeywords.forEach((keyword: string) => {
      // Simple inclusion check
      if (normalizedAnswer.includes(keyword.toLowerCase())) {
        this.foundKeywords.push(keyword);
        matchCount++;
      } else {
        this.missedKeywords.push(keyword);
      }
    });

    // Calculate Percentage
    this.score = Math.round((matchCount / requiredKeywords.length) * 100);
    this.scoreCalculated.emit(this.score);
  }
}
