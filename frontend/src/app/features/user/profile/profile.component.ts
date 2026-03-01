import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { UserProfile } from '../../../core/models/user.model';
import { environment } from '../../../../environments/environment';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DEPARTMENTS } from '../../../core/constants/departments.constant';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, TranslateModule],
  providers: [MessageService],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  currentUser: UserProfile | null = null;
  isLoading = false;
  selectedFile: File | null = null;
  displayImageUrl: string | null = null;
  removeExistingImage = false;
  departments = DEPARTMENTS;

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: [{ value: '', disabled: true }], // Email is read-only
      studentNumber: [''],
      department: [''],
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.userService.getProfile().subscribe({
      next: (response: any) => {
        if (response.isSuccess) {
          this.currentUser = response.data;
          this.profileForm.patchValue({
            firstName: this.currentUser?.firstName,
            lastName: this.currentUser?.lastName,
            email: this.currentUser?.email,
            studentNumber: this.currentUser?.studentNumber,
            department: this.currentUser?.department,
          });

          this.removeExistingImage = false; // Reset flag on load

          if (this.currentUser?.profileImageUrl) {
            this.displayImageUrl = `${environment.baseUrl}${this.currentUser.profileImageUrl}`;
          } else {
            this.displayImageUrl = 'assets/images/default-avatar.png'; // Set default if no image
          }
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading profile', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('ERROR'),
          detail: 'Failed to load profile data.',
        });
        this.isLoading = false;
      },
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.removeExistingImage = false; // Reset delete flag if new one selected

      // Update preview directly to displayImageUrl (Optimistic Update)
      const reader = new FileReader();
      reader.onload = () => {
        this.displayImageUrl = reader.result as string;
      };
      reader.readAsDataURL(file);

      // Call Update Immediately
      this.updateProfileImage(file, false);
    }
  }

  removePhoto(): void {
    this.displayImageUrl = 'assets/images/default-avatar.png'; // Optimistic Update
    this.selectedFile = null;
    this.removeExistingImage = true;

    const fileInput = document.getElementById(
      'file-upload',
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    // Call Update Immediately
    this.updateProfileImage(null, true);
  }

  // New helper method for image updates
  updateProfileImage(file: File | null, removeExisting: boolean): void {
    if (this.profileForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('WARNING'),
        detail: this.translate.instant('PLEASE_FILL_REQUIRED_FIELDS'),
      });
      // Since we optimistically updated the UI, we should revert if validation fails
      // But simplest is just to reload the profile to restore correct state
      setTimeout(() => this.loadProfile(), 500);
      return;
    }

    this.isLoading = true;
    // We need to send current form values because API updates the whole user
    const payload = {
      ...this.profileForm.getRawValue(),
      profileImage: file,
      removeExistingImage: removeExisting,
    };
    // delete payload.email if it causes issues, but it should be fine as readonly

    this.userService.updateProfile(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.isSuccess) {
          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('SUCCESS'),
            detail: this.translate.instant('PROFILE_UPDATED_SUCCESSFULLY'),
          });
          this.loadProfile(); // Sync with backend
        } else {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('ERROR'),
            detail: res.message || 'Update failed',
          });
          this.loadProfile(); // Revert
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('ERROR'),
          detail: 'Failed to update image',
        });
        this.loadProfile(); // Revert
      },
    });
  }

  handleImageError(event: any) {
    event.target.src = 'assets/images/default-avatar.png'; // Fail-safe fallback
    // Also update model to reflect broken link if needed, or just UI
    this.displayImageUrl = 'assets/images/default-avatar.png';
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('WARNING'),
        detail: this.translate.instant('PLEASE_FILL_REQUIRED_FIELDS'),
      });
      return;
    }

    this.isLoading = true;

    const updateData = {
      ...this.profileForm.value,
      // We don't send image data here since it's handled separately now
      // sending null/false ensures we don't accidentally wipe out an image if user hits save
      // after uploading one via the new buttons.
      // Actually, if we send null/false, the backend logic says:
      // if remove=false and image=null -> DO NOTHING to image. Which is correct.
      profileImage: null,
      removeExistingImage: false,
    };

    this.userService.updateProfile(updateData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.isSuccess) {
          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('SUCCESS'),
            detail: this.translate.instant('PROFILE_UPDATED_SUCCESSFULLY'),
          });
          // Optionally refresh data
          this.loadProfile();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('ERROR'),
            detail: response.message || 'Update failed.',
          });
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error updating profile', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('ERROR'),
          detail: 'Failed to update profile. Please try again.',
        });
      },
    });
  }
}
