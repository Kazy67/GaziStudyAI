import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { UpdateProfileDto, UserProfile } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly API_URL = 'https://localhost:7070/api/user'; // Keeping consistent with auth.service.ts

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/profile`).pipe(
      tap((response) => {
        if (response.isSuccess) {
          this.currentUserSubject.next(response.data);
        }
      }),
    );
  }

  updateProfile(data: UpdateProfileDto): Observable<any> {
    const formData = new FormData();
    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName);
    if (data.studentNumber) {
      formData.append('studentNumber', data.studentNumber);
    }
    if (data.department) {
      formData.append('department', data.department);
    }
    if (data.profileImage) {
      formData.append('profileImage', data.profileImage);
    }
    if (data.removeExistingImage) {
      formData.append('removeExistingImage', 'true');
    }

    return this.http.put(`${this.API_URL}/profile`, formData).pipe(
      tap((response: any) => {
        if (response.isSuccess) {
          // Re-fetch profile to keep state in sync, or if response includes data use that
          // Since our update returns success but maybe not full user object, reloading is safest
          this.getProfile().subscribe();
        }
      }),
    );
  }
}
