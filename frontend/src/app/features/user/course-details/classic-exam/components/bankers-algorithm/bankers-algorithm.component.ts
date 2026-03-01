// bankers-algorithm.component.ts
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
  selector: 'app-bankers-algorithm',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './bankers-algorithm.component.html',
})
export class BankersAlgorithmComponent implements OnInit, OnChanges {
  @Input() question: any;
  @Input() isSubmitted: boolean = false;
  @Output() scoreCalculated = new EventEmitter<number>();

  userIsSafe: boolean | null = null;
  userSafeSequence: string = '';

  constructor() {}

  ngOnInit() {
    // Optionally initialize any data struct if needed
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isSubmitted'] && this.isSubmitted) {
      this.calculateScore();
    }
  }

  isSequenceCorrect(): boolean {
    if (!this.userSafeSequence) return false;

    // 1. Clean the user input (e.g., "p1, P3 , p0" -> ["P1", "P3", "P0"])
    const userInput = this.userSafeSequence
      .toUpperCase()
      .replace(/\s+/g, '')
      .split(',')
      .filter((t) => t.length > 0);

    const processes = this.question.inputData.processes;

    // 2. Basic Validation: Did they enter the right amount of unique processes?
    if (userInput.length !== processes.length) return false;
    const uniqueInput = new Set(userInput);
    if (uniqueInput.size !== processes.length) return false;

    // 3. Clone the Available array so we can simulate the math
    let currentAvailable = [...this.question.inputData.available];

    // 4. THE SIMULATOR: Test the user's sequence step-by-step
    for (const procId of userInput) {
      // Find the process they typed
      const proc = processes.find((p: any) => p.id.toUpperCase() === procId);
      if (!proc) return false; // They typed a process that doesn't exist

      // Check if this process can run (Need <= Available)
      for (let i = 0; i < currentAvailable.length; i++) {
        const need = proc.max[i] - proc.allocation[i];

        // If the process needs more than what is available, their sequence causes a DEADLOCK!
        if (need > currentAvailable[i]) {
          return false;
        }
      }

      // If it can run, it finishes and RELEASES its allocated resources back to Available
      for (let i = 0; i < currentAvailable.length; i++) {
        currentAvailable[i] += proc.allocation[i];
      }
    }

    // 5. If the loop finishes without returning false, their sequence perfectly avoided deadlock!
    return true;
  }

  calculateScore() {
    let score = 0;
    const sol = this.question.solutionData;

    if (this.userIsSafe === sol.isSafe) {
      score += 50;
    }

    // Part 2: Correct sequence (50%) - Only if it was safe
    if (sol.isSafe) {
      if (this.isSequenceCorrect()) {
        score += 50;
      }
    } else {
      if (this.userIsSafe === sol.isSafe) {
        score = 100;
      }
    }

    this.scoreCalculated.emit(score);
  }
}
