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
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    ButtonModule,
    ToastModule,
    InputTextModule,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
  ],
  providers: [MessageService],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translateService = inject(TranslateService);

  isSubmitting = false;

  protected forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const email = this.forgotPasswordForm.value.email;

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: this.translateService.instant('SUCCESS'),
          detail: this.translateService.instant('NEW_CODE_SENT'),
          life: 3000,
        });
        // Redirect to reset password page with email query param
        setTimeout(() => {
          this.router.navigate(['/reset-password'], {
            queryParams: { email: email },
          });
        }, 1500);
      },
      error: (err) => {
        const messageCode =
          err.error?.messageCode || err.error?.MessageCode || 'ERROR';
        this.messageService.add({
          severity: 'error',
          summary: this.translateService.instant('ERROR'),
          detail: this.translateService.instant(messageCode),
          life: 3000,
        });
        this.isSubmitting = false;
      },
    });
  }
}
