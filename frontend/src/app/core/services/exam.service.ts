import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenerateTestRequest, GeneratedQuestion } from '../models/test.model';
import {
  ClassicRequest,
  ClassicQuestion,
  SubmitExamDto,
  StudentDashboardDto,
  EvaluateClassicRequest,
  EvaluationResult,
} from '../models/exam.model';
import { ServiceResult } from '../models/service-result.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/exam`;

  generateTest(
    request: GenerateTestRequest,
  ): Observable<ServiceResult<GeneratedQuestion[]>> {
    return this.http.post<ServiceResult<GeneratedQuestion[]>>(
      `${this.apiUrl}/generate-test`,
      request,
    );
  }

  generateClassicExam(
    request: ClassicRequest,
  ): Observable<ServiceResult<ClassicQuestion[]>> {
    return this.http.post<ServiceResult<ClassicQuestion[]>>(
      `${this.apiUrl}/generate-classic`,
      request,
    );
  }

  evaluateClassicQuestion(
    request: EvaluateClassicRequest,
  ): Observable<ServiceResult<EvaluationResult>> {
    return this.http.post<ServiceResult<EvaluationResult>>(
      `${this.apiUrl}/evaluate-classic`,
      request,
    );
  }

  submitExam(data: SubmitExamDto): Observable<ServiceResult<boolean>> {
    return this.http.post<ServiceResult<boolean>>(
      `${this.apiUrl}/submit-result`,
      data,
    );
  }

  getDashboard(): Observable<ServiceResult<StudentDashboardDto>> {
    return this.http.get<ServiceResult<StudentDashboardDto>>(
      `${this.apiUrl}/dashboard`,
    );
  }
}
