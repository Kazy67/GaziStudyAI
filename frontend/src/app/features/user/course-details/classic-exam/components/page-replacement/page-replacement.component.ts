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
  selector: 'app-page-replacement',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './page-replacement.component.html',
})
export class PageReplacementComponent implements OnInit, OnChanges {
  @Input() question: any;
  @Input() isSubmitted: boolean = false;
  @Output() scoreCalculated = new EventEmitter<number>();

  userFrames: (string | null)[][] = [];
  userStatus: string[] = [];
  userFaults: number | null = null;
  frameRows: number[] = [];

  ngOnInit() {
    this.initGrid();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['question'] && this.question) {
      this.initGrid();
    }
    if (changes['isSubmitted'] && this.isSubmitted) {
      this.calculateScore();
    }
  }

  initGrid() {
    if (!this.question?.inputData) return;

    const stepsCount = this.question.inputData.referenceString.length;
    const framesCount = this.question.inputData.frames || 3;

    this.frameRows = Array.from({ length: framesCount }, (_, i) => i);
    this.userFrames = Array.from({ length: stepsCount }, () =>
      Array(framesCount).fill(''),
    );
    this.userStatus = Array(stepsCount).fill('');
    this.userFaults = null;
  }

  // Check if the HIT/MISS dropdown is correct
  isValidStatus(stepIndex: number): boolean {
    if (!this.question?.solutionData?.steps) return false;
    const solStatus = this.question.solutionData.steps[stepIndex]?.status;
    const userStat = this.userStatus[stepIndex];

    // If user left it blank, it is instantly wrong
    if (!userStat || userStat === '') return false;

    return userStat.toUpperCase() === solStatus?.toUpperCase();
  }

  calculateScore() {
    if (!this.question?.solutionData) return;

    let score = 0;
    const sol = this.question.solutionData;
    const stepsCount = this.question.inputData.referenceString.length;

    // 1. Grade the Status (HIT/MISS) Dropdowns (50% of total score)
    let correctStatus = 0;
    for (let i = 0; i < stepsCount; i++) {
      if (this.isValidStatus(i)) {
        correctStatus++;
      }
    }
    const statusScore = stepsCount > 0 ? (correctStatus / stepsCount) * 50 : 0;
    score += statusScore;

    // 2. Grade Total Faults (50% of total score)
    if (
      this.userFaults !== null &&
      Number(this.userFaults) === Number(sol.totalPageFaults)
    ) {
      score += 50;
    }

    this.scoreCalculated.emit(Math.round(score));
  }
}
