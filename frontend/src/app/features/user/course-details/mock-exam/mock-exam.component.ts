import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mock-exam',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 text-center bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Mock Exam
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        This feature is coming soon!
      </p>
      <div class="mt-6">
        <div
          class="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300"
        >
          <svg
            class="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
        </div>
      </div>
    </div>
  `,
})
export class MockExamComponent {}
