export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  studentNumber?: string;
  department?: string;
}

export interface AuthResponse {
  id: string;
  fullName: string;
  email: string;
  role: string;
  token: string;
  isVerified: boolean;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
}

export interface ResetPasswordDto {
  email: string;
  code: string;
  newPassword: string;
}

export interface LoginDto {
  email: string;
  password: string;
}