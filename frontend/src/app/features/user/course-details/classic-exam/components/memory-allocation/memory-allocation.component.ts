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
  selector: 'app-memory-allocation',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './memory-allocation.component.html',
})
export class MemoryAllocationComponent implements OnInit, OnChanges {
  @Input() question: any;
  @Input() isSubmitted: boolean = false;
  @Output() scoreCalculated = new EventEmitter<number>();

  // Map: processId (string) -> partitionId (string | null)
  userAllocations: { [processId: string]: string | null } = {};

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['question'] && this.question) {
      this.initForm();
    }
    if (changes['isSubmitted'] && this.isSubmitted) {
      this.calculateScore();
    }
  }

  initForm() {
    if (!this.question?.inputData?.processes) return;

    this.userAllocations = {};
    this.question.inputData.processes.forEach((proc: any) => {
      // Default to null (not allocated)
      this.userAllocations[proc.id] = null;
    });
  }

  findCorrectPartitionId(processId: string): string | null {
    if (!this.question?.solutionData?.allocations) return null;

    const allocation = this.question.solutionData.allocations.find(
      (a: any) => a.processId === processId,
    );
    return allocation ? allocation.partitionId : null;
  }

  isAllocationCorrect(processId: string): boolean {
    const userVal = this.userAllocations[processId];
    const correctVal = this.findCorrectPartitionId(processId);

    // Use loose equality to handle null/undefined or string equivalents if any
    return userVal == correctVal;
  }

  calculateScore() {
    if (!this.question?.inputData?.processes) return;

    const processes = this.question.inputData.processes;
    let correctCount = 0;

    processes.forEach((proc: any) => {
      if (this.isAllocationCorrect(proc.id)) {
        correctCount++;
      }
    });

    const score = (correctCount / processes.length) * 100;
    this.scoreCalculated.emit(score);
  }
}
