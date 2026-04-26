import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { SystemLogDto } from '../../../core/models/admin.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-ai-logs',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './ai-logs.component.html',
  styleUrls: ['./ai-logs.component.scss'],
})
export class AiLogsComponent implements OnInit {
  private adminService = inject(AdminService);
  translate = inject(TranslateService);

  logs = signal<SystemLogDto[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.fetchLogs();
  }

  fetchLogs() {
    this.isLoading.set(true);
    this.adminService.getSystemLogs().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.logs.set(res.data);
        } else {
          this.logs.set([]);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching logs', err);
        this.logs.set([]);
        this.isLoading.set(false);
      },
    });
  }

  refresh() {
    this.fetchLogs();
  }
}
