import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeSwitcherComponent } from '../../shared/components/theme-switcher/theme-switcher.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { LayoutService } from '../../core/services/layout.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/models/user.model';
import { environment } from '../../../environments/environment';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    ThemeSwitcherComponent,
    LanguageSwitcherComponent,
    RouterLink,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  layoutService = inject(LayoutService);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  user: UserProfile | null = null;
  displayImageUrl: string | null = null;
  initialsAvatarUrl: string | null = null;

  isUserMenuOpen = false;

  get homeLink(): string {
    return this.authService.isAdmin() ? '/admin/dashboard' : '/home';
  }

  ngOnInit(): void {
    // Reactively update the user profile
    this.userService.currentUser$.subscribe((profile) => {
      this.user = profile;
      this.setAvatar();
    });

    // Still fetch once on init to populate the subject if it's empty
    this.userService.getProfile().subscribe({
      error: (err) => console.error('Failed to load user in navbar', err),
    });
  }

  // loadUserProfile() is removed as it's replaced by the subscription above

  setAvatar() {
    if (this.user) {
      // 1. Initials Avatar (Fallback)
      const fullName = `${this.user.firstName} ${this.user.lastName}`;
      this.initialsAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff`;

      // 2. Profile Image (Primary)
      if (this.user.profileImageUrl) {
        this.displayImageUrl = `${environment.baseUrl}${this.user.profileImageUrl}`;
      } else {
        this.displayImageUrl = null;
      }
    }
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  handleImageError(event: any) {
    // If main image fails, fall back to initials
    event.target.src = this.initialsAvatarUrl;
  }
}
