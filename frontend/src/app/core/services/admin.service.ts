import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminDashboardDto } from '../models/admin.model';
import { ServiceResult } from '../models/service-result.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  getDashboardStatistics(): Observable<ServiceResult<AdminDashboardDto>> {
    return this.http.get<ServiceResult<AdminDashboardDto>>(
      `${this.apiUrl}/statistics`,
    );
  }
}
