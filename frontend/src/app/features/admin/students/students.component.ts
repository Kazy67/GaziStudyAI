import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { StudentDirectoryItemDto } from '../../../core/models/admin.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    FormsModule,
    ButtonModule,
  ],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.scss'],
})
export class StudentsComponent implements OnInit {
  adminService = inject(AdminService);
  translate = inject(TranslateService);

  students: StudentDirectoryItemDto[] = [];
  loading: boolean = true;
  error: string | null = null;

  globalFilterValue: string = '';

  ngOnInit() {
    this.fetchStudents();
  }

  fetchStudents() {
    this.loading = true;
    this.adminService.getAllStudents().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.students = res.data;
        } else {
          this.error = res.message || 'Failed to load students.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'An error occurred';
        this.loading = false;
      },
    });
  }

  clearFilter(table: any) {
    table.clear();
    this.globalFilterValue = '';
  }
}
