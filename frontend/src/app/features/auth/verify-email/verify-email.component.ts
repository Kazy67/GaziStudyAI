import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InputOtpModule } from 'primeng/inputotp';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    InputOtpModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
  ],
  providers: [MessageService],
  templateUrl: './verify-email.component.html',
  styles: [
    `
      :host ::ng-deep .p-inputotp-input {
        @apply w-12 h-12 text-center text-xl border rounded-lg outline-none transition-all mr-2 !important;
        background-color: transparent;
        @apply border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white !important;
        @apply focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 !important;
      }
      :host-context(.dark) ::ng-deep .p-inputotp-input {
        background-color: #1f2937 !important; /* gray-800 */
        border-color: #4b5563 !important; /* gray-600 */
        color: white !important;
      }
    `,
  ],
})
export class VerifyEmailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private readonly translationService = inject(TranslateService);

  protected verifyForm: FormGroup = this.fb.group({
    email: [
      { value: '', disabled: true },
      [Validators.required, Validators.email],
    ],
    code: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected isLoading = false;
  protected isResending = false;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['email']) {
        this.verifyForm.patchValue({ email: params['email'] });
      }
    });
  }

  onVerify() {
    if (this.verifyForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translationService.instant('WARNING'),
        detail: this.translationService.instant('PLEASE_ENTER_6_DIGIT_CODE'),
      });
      return;
    }

    this.isLoading = true;
    const { code } = this.verifyForm.getRawValue();
    const email = this.verifyForm.get('email')?.value;

    this.authService.verifyEmail({ email, code }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const messageCode = response.messageCode || 'VERIFICATION_SUCCESS';
        this.messageService.add({
          severity: 'success',
          summary: this.translationService.instant('SUCCESS'),
          detail: this.translationService.instant(messageCode),
        });
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        const messageCode =
          err.error?.messageCode ||
          err.error?.MessageCode ||
          'VERIFICATION_FAILED';
        this.messageService.add({
          severity: 'error',
          summary: this.translationService.instant('ERROR'),
          detail: this.translationService.instant(messageCode),
        });
      },
    });
  }

  onResendCode() {
    const email = this.verifyForm.get('email')?.value;
    if (!email) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translationService.instant('WARNING'),
        detail: this.translationService.instant('EMAIL_MISSING'),
      });
      return;
    }

    this.isResending = true;
    this.authService.resendVerificationCode(email).subscribe({
      next: (response: any) => {
        this.isResending = false;
        const messageCode = response.messageCode || 'NEW_CODE_SENT';
        this.messageService.add({
          severity: 'info',
          summary: this.translationService.instant('INFO'),
          detail: this.translationService.instant(messageCode),
        });
      },
      error: (err) => {
        this.isResending = false;
        const messageCode =
          err.error?.messageCode || err.error?.MessageCode || 'RESEND_FAILED';
        this.messageService.add({
          severity: 'error',
          summary: this.translationService.instant('ERROR'),
          detail: this.translationService.instant(messageCode),
        });
      },
    });
  }
}
