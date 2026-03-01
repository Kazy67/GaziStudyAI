import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher/theme-switcher.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DEPARTMENTS } from '../../../core/constants/departments.constant';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterLink,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translationService = inject(TranslateService);

  departments = DEPARTMENTS;

  protected registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    studentNumber: [''],
    department: [''],
  });

  protected isLoading = false;

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: this.translationService.instant('WARNING'),
        detail: this.translationService.instant('PLEASE_FILL_REQUIRED_FIELDS'),
      });
      return;
    }

    this.isLoading = true;
    const formData = this.registerForm.value;

    this.authService.register(formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('Registration successful', response);

        const messageCode = response.messageCode || 'REGISTRATION_SUCCESSFUL'; // Fallback

        this.messageService.add({
          severity: 'success',
          summary: this.translationService.instant('SUCCESS'),
          detail: this.translationService.instant(messageCode),
        });

        setTimeout(() => {
          this.router.navigate(['/verify-email'], {
            queryParams: { email: formData.email },
          });
        }, 1500);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Registration failed', error);

        const messageCode =
          error.error?.messageCode ||
          error.error?.MessageCode ||
          'VALIDATION_FAILED';

        this.messageService.add({
          severity: 'error',
          summary: this.translationService.instant('ERROR'),
          detail: this.translationService.instant(messageCode),
        });
      },
    });
  }
}
