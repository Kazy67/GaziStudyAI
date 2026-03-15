import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-vp-code-completion',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './vp-code-completion.component.html',
})
export class VpCodeCompletionComponent implements OnInit, OnChanges {
  @Input() question: any;
  @Input() isSubmitted: boolean = false;
  @Output() scoreCalculated = new EventEmitter<number>();

  userCode: string = '';
  codeParts: string[] = [];
  score: number = 0;

  constructor() {}

  ngOnInit() {
    this.parseCodeSnippet();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['question'] && this.question) {
      this.resetState();
      this.parseCodeSnippet();
    }
    if (changes['isSubmitted'] && this.isSubmitted) {
      this.calculateScore();
    }
  }

  resetState() {
    this.userCode = '';
    this.score = 0;
    this.codeParts = [];
  }

  parseCodeSnippet() {
    if (this.question?.inputData?.codeSnippet) {
      const rawString = this.question.inputData.codeSnippet.replace(
        /\\n/g,
        '\n',
      );
      this.codeParts = rawString.split('_____');
    }
  }

  calculateScore() {
    const correct = this.question?.solutionData?.correctCode || '';

    // Normalize: trim spaces
    if (this.userCode.trim() === correct.trim()) {
      this.score = 100;
    } else {
      this.score = 0;
    }

    this.scoreCalculated.emit(this.score);
  }
}
