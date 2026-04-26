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
  selector: 'app-vp-sql-query',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './vp-sql-query.component.html',
})
export class VpSqlQueryComponent implements OnInit, OnChanges {
  @Input() question: any;
  @Input() isSubmitted: boolean = false;
  @Output() scoreCalculated = new EventEmitter<number>();

  userQuery: string = '';
  score: number = 0;

  constructor() {}

  ngOnInit() {
    this.userQuery = this.question?.userAnswer || '';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['question'] && this.question) {
      this.resetState();
      this.userQuery = this.question.userAnswer || '';
    }
    if (changes['isSubmitted']) {
      if (this.isSubmitted) {
        this.calculateScore();
      } else {
        this.resetState();
      }
    }
  }

  onQueryChange() {
    if (this.question) {
      this.question.userAnswer = this.userQuery;
    }
  }

  resetState() {
    this.userQuery = '';
    this.score = 0;
  }

  calculateScore() {
    const correctQuery = this.question?.solutionData?.correctQuery || '';

    // Clean both the user's answer and the AI's answer
    const userNorm = this.normalizeSql(this.userQuery);
    const solNorm = this.normalizeSql(correctQuery);

    if (userNorm === solNorm) {
      this.score = 100;
    } else {
      this.score = 0;
    }

    this.scoreCalculated.emit(this.score);
  }

  normalizeSql(sql: string): string {
    if (!sql) return '';
    return sql
      .trim() // Removes spaces at the very beginning and end
      .toUpperCase() // Makes everything uppercase (select == SELECT)
      .replace(/\s+/g, ' ') // THE MAGIC: Replaces any multiple spaces, tabs, or enters with a single space
      .replace(/;$/, ''); // Removes a semicolon at the very end if the user typed one
  }
}
