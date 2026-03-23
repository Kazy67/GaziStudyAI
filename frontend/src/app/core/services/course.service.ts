import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceResult } from '../models/service-result.model';
import { Course } from '../models/course.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}/Course`;

  constructor(private http: HttpClient) {}

  getAllCourses(): Observable<ServiceResult<Course[]>> {
    return this.http.get<ServiceResult<Course[]>>(this.apiUrl);
  }

  getCourseById(id: string): Observable<ServiceResult<Course>> {
    return this.http.get<ServiceResult<Course>>(`${this.apiUrl}/${id}`);
  }

  createCourse(courseData: FormData): Observable<ServiceResult<string>> {
    return this.http.post<ServiceResult<string>>(this.apiUrl, courseData);
  }

  updateCourse(courseData: FormData): Observable<ServiceResult<string>> {
    return this.http.put<ServiceResult<string>>(this.apiUrl, courseData);
  }

  deleteCourse(id: string): Observable<ServiceResult<void>> {
    return this.http.delete<ServiceResult<void>>(`${this.apiUrl}/${id}`);
  }

  getMaterialsStatus(courseId: string): Observable<ServiceResult<any>> {
    // Add cache-busting timestamp to prevent 400 errors from being deeply cached by the browser
    return this.http.get<ServiceResult<any>>(
      `${this.apiUrl}/${courseId}/materials?t=${new Date().getTime()}`,
    );
  }

  uploadMaterial(
    courseId: string,
    weekNumber: number,
    file: File,
  ): Observable<ServiceResult<any>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ServiceResult<any>>(
      `${this.apiUrl}/${courseId}/weeks/${weekNumber}/upload-material`,
      formData,
    );
  }

  deleteMaterial(weekTag: string): Observable<ServiceResult<any>> {
    return this.http.delete<ServiceResult<any>>(
      `${this.apiUrl}/materials/${weekTag}`,
    );
  }

  getStudentExamSetup(courseId: string): Observable<ServiceResult<any>> {
    return this.http.get<ServiceResult<any>>(
      `${this.apiUrl}/${courseId}/student-exam-setup?t=${new Date().getTime()}`,
    );
  }
}
