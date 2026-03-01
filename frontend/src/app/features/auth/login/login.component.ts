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
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-login',
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
    CheckboxModule,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private readonly translationService = inject(TranslateService);

  protected loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  protected isLoading = false;

  onSubmit() {
    if (this.loginForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translationService.instant('WARNING'),
        detail: this.translationService.instant('PLEASE_FILL_REQUIRED_FIELDS'),
      });
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        console.log('Login response:', response);
        this.isLoading = false;
        if (response?.token) {
          localStorage.setItem('access_token', response.token);
        } else if (response?.data?.token) {
          localStorage.setItem('access_token', response.data.token);
        }

        this.messageService.add({
          severity: 'success',
          summary: this.translationService.instant('WELCOME_BACK'),
          detail: this.translationService.instant('LOGIN_SUCCESS'),
        });
        setTimeout(() => this.router.navigate(['/home']), 1000);
      },
      error: (err) => {
        this.isLoading = false;

        const messageCode =
          err.error?.messageCode || err.error?.MessageCode || 'LOGIN_FAILED';

        this.messageService.add({
          severity: 'error',
          summary: this.translationService.instant('LOGIN_FAILED'),
          detail:
            this.translationService.instant(messageCode) ||
            this.translationService.instant('INVALID_CREDENTIALS'),
        });
      },
    });
  }
}
