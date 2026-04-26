import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

interface GanttSegment {
  process: string;
  start: number;
  end: number;
}

interface ProcessMetric {
  process: string;
  turnaroundTime: number | null;
  waitingTime: number | null;
}

interface UserAnswers {
  ganttChart: GanttSegment[];
  processMetrics: ProcessMetric[]; // Array matched by index or process name to inputData.rows
  averageTurnaroundTime: number | null;
  averageWaitingTime: number | null;
}

@Component({
  selector: 'app-cpu-scheduling',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './cpu-scheduling.component.html',
})
export class CpuSchedulingComponent implements OnInit, OnChanges {
  @Input() question: any;
  @Input() isSubmitted: boolean = false;
  @Output() scoreCalculated = new EventEmitter<number>();

  // Track the user's answers
  userAnswers: UserAnswers = {
    ganttChart: [],
    processMetrics: [],
    averageTurnaroundTime: null,
    averageWaitingTime: null,
  };

  // Alias for existing logic
  get ganttSegments(): GanttSegment[] {
    return this.userAnswers.ganttChart;
  }
  set ganttSegments(val: GanttSegment[]) {
    this.userAnswers.ganttChart = val;
  }

  // Helper to get rows easily
  get rows(): any[] {
    return this.question?.inputData?.rows || [];
  }

  ngOnInit() {
    this.initialize();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['question']) {
      this.initialize();
    }

    if (changes['isSubmitted']) {
      if (this.isSubmitted) {
        this.calculateScore();
      } else {
        this.initialize();
      }
    }
  }

  initialize() {
    if (!this.question) return;

    // Initialize user answers structure
    if (!this.question.userAnswer) {
      // Create empty structure
      this.question.userAnswer = {
        ganttChart: [],
        processMetrics: [], // Needs to be populated
        averageTurnaroundTime: null,
        averageWaitingTime: null,
      };
    }

    this.userAnswers = this.question.userAnswer;

    // Ensure processMetrics has an entry for each row
    const rowCount = this.rows.length;
    if (
      !this.userAnswers.processMetrics ||
      this.userAnswers.processMetrics.length !== rowCount
    ) {
      this.userAnswers.processMetrics = this.rows.map((row) => ({
        process: row[0], // Assuming first column is always Process Name (P1, P2...)
        turnaroundTime: null,
        waitingTime: null,
      }));
      // Refind to the question object
      this.question.userAnswer.processMetrics = this.userAnswers.processMetrics;
    }

    // Ensure ganttChart exists (existing logic compatibility)
    if (!this.userAnswers.ganttChart) {
      this.userAnswers.ganttChart = [];
      this.addSegment(); // Start with one
    } else if (this.userAnswers.ganttChart.length === 0) {
      this.addSegment();
    }
  }

  calculateScore() {
    // 1. Calculate total possible points
    // Per process: 2 points (1 for TAT, 1 for WT)
    // Plus 2 global points (1 for ATAT, 1 for AWT)
    const totalPossiblePoints = this.rows.length * 2 + 2;
    let earnedPoints = 0;

    // 2. Grade Process Metrics
    this.userAnswers.processMetrics.forEach((metric) => {
      // Check Turnaround Time
      if (
        this.isMetricCorrect(
          metric.process,
          'turnaroundTime',
          metric.turnaroundTime,
        )
      ) {
        earnedPoints++;
      }
      // Check Waiting Time
      if (
        this.isMetricCorrect(metric.process, 'waitingTime', metric.waitingTime)
      ) {
        earnedPoints++;
      }
    });

    // 3. Grade Averages
    if (
      this.isAvgCorrect(
        'averageTurnaroundTime',
        this.userAnswers.averageTurnaroundTime,
      )
    ) {
      earnedPoints++;
    }
    if (
      this.isAvgCorrect(
        'averageWaitingTime',
        this.userAnswers.averageWaitingTime,
      )
    ) {
      earnedPoints++;
    }

    // 4. Calculate Percentage and Emit
    const percentage =
      totalPossiblePoints > 0 ? (earnedPoints / totalPossiblePoints) * 100 : 0;

    // Using a timeout to ensure parent component is ready/rendering might not be strictly necessary
    // but good practice if bindings are tight. Here direct emit is fine.
    this.scoreCalculated.emit(percentage);
  }

  // --- Gantt Chart Logic (Preserved) ---
  addSegment() {
    const lastEnd =
      this.ganttSegments.length > 0
        ? this.ganttSegments[this.ganttSegments.length - 1].end
        : 0;
    this.ganttSegments.push({ process: '', start: lastEnd, end: lastEnd + 1 });
  }

  removeSegment(index: number) {
    this.ganttSegments.splice(index, 1);
  }

  // --- Grading / Validation Helpers ---

  getCorrectMetric(
    processName: string,
    metric: 'turnaroundTime' | 'waitingTime',
  ): number | undefined {
    if (!this.question.solutionData?.processMetrics) return undefined;
    const p = this.question.solutionData.processMetrics.find(
      (m: any) => m.process === processName,
    );
    return p ? p[metric] : undefined;
  }

  isMetricCorrect(
    processName: string,
    metric: 'turnaroundTime' | 'waitingTime',
    value: number | null,
  ): boolean {
    if (value === null || value === undefined) return false;
    const correct = this.getCorrectMetric(processName, metric);
    return correct !== undefined && Number(value) === Number(correct);
  }

  getCorrectAvg(
    type: 'averageTurnaroundTime' | 'averageWaitingTime',
  ): number | undefined {
    return this.question.solutionData?.[type];
  }

  isAvgCorrect(
    type: 'averageTurnaroundTime' | 'averageWaitingTime',
    value: number | null,
  ): boolean {
    if (value === null || value === undefined) return false;
    const correct = this.getCorrectAvg(type);
    if (correct === undefined) return false;
    // Allow small float diff or exact string match if needed.
    // User asked for step 0.01 inputs. Standard float epsilon check:
    return Math.abs(Number(value) - Number(correct)) < 0.02;
  }
}
