import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'https://localhost:7070/api/auth';

  constructor(private http: HttpClient) {}

  register(data: RegisterDto): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, data);
  }

  verifyEmail(data: VerifyEmailDto): Observable<any> {
    return this.http.post(`${this.API_URL}/verify-email`, data);
  }

  login(data: LoginDto): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, data);
  }

  resendVerificationCode(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/resend-verification-email`, {
      email,
    });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/forgot-password`, { email });
  }

  resetPassword(data: ResetPasswordDto): Observable<any> {
    return this.http.post(`${this.API_URL}/reset-password`, data);
  }

  isAdmin(): boolean {
    const role = localStorage.getItem('user_role');
    return role === 'Admin';
  }
}
