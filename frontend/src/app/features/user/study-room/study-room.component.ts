import {
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../../../core/services/course.service';
import { ExamService } from '../../../core/services/exam.service';
import { Course } from '../../../core/models/course.model';
import { marked } from 'marked';
import { MathjaxDirective } from '../../../shared/directives/mathjax';

@Component({
  selector: 'app-study-room',
  standalone: true,
  imports: [CommonModule, FormsModule, MathjaxDirective],
  templateUrl: './study-room.component.html',
  styleUrl: './study-room.component.scss',
})
export class StudyRoomComponent implements OnInit, AfterViewChecked {
  courseService = inject(CourseService);
  examService = inject(ExamService);

  courses = signal<Course[]>([]);
  selectedCourseId = signal<string | null>(null);

  messages = signal<
    { role: 'user' | 'ai'; text: string; parsedText?: string }[]
  >([]);
  userInput = signal<string>('');
  isTyping = signal<boolean>(false);

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  ngOnInit() {
    this.courseService.getAllCourses().subscribe((res) => {
      if (res.isSuccess && res.data) {
        this.courses.set(res.data);
      }
    });

    // Configure marked to format code nicely and sanitize
    marked.setOptions({
      breaks: true,
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  selectCourse(courseId: string) {
    if (this.selectedCourseId() !== courseId) {
      this.selectedCourseId.set(courseId);
      this.messages.set([
        {
          role: 'ai',
          text: 'Merhaba! Dersinizle ilgili bana istediğiniz soruyu sorabilirsiniz.',
          parsedText:
            'Merhaba! Dersinizle ilgili bana istediğiniz soruyu sorabilirsiniz.',
        },
      ]);
    }
  }

  async sendMessage() {
    const courseId = this.selectedCourseId();
    const text = this.userInput().trim();

    if (!courseId || !text || this.isTyping()) return;

    this.messages.update((m) => [...m, { role: 'user', text }]);
    this.userInput.set('');
    this.isTyping.set(true);

    this.examService.sendChatMessage({ courseId, message: text }).subscribe(
      async (res) => {
        if (res.isSuccess && res.data) {
          const responseData = res.data;
          const parsed = await marked.parse(responseData);
          this.messages.update((m) => [
            ...m,
            { role: 'ai', text: responseData, parsedText: parsed },
          ]);
        } else {
          this.messages.update((m) => [
            ...m,
            {
              role: 'ai',
              text: 'Üzgünüm, bir hata oluştu.',
              parsedText: 'Üzgünüm, bir hata oluştu.',
            },
          ]);
        }
        this.isTyping.set(false);
      },
      (error) => {
        this.messages.update((m) => [
          ...m,
          {
            role: 'ai',
            text: 'Üzgünüm, sunucu ile iletişim kurulamadı.',
            parsedText: 'Üzgünüm, sunucu ile iletişim kurulamadı.',
          },
        ]);
        this.isTyping.set(false);
      },
    );
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop =
        this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
