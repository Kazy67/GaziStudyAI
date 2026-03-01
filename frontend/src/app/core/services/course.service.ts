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
}
