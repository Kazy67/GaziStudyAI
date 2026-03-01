import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    ButtonModule,
    ToastModule,
    PasswordModule,
    InputTextModule,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
  ],
  providers: [MessageService],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private translateService = inject(TranslateService);

  isSubmitting = false;

  protected resetPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    // Get email from query params if available
    this.route.queryParams.subscribe((params) => {
      if (params['email']) {
        this.resetPasswordForm.patchValue({ email: params['email'] });
      }
    });
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const { email, code, newPassword } = this.resetPasswordForm.value;

    this.authService.resetPassword({ email, code, newPassword }).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: this.translateService.instant('SUCCESS'),
          detail: this.translateService.instant('RESET_PASSWORD_SUCCESS'),
          life: 3000,
        });
        setTimeout(() => {
          this.router.navigate(['/login']);
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
