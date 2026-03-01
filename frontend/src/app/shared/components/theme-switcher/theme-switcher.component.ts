import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-switcher.html',
})
export class ThemeSwitcherComponent {
  private themeService = inject(ThemeService);

  // Expose signal or computed value for template
  isDark = computed(() => this.themeService.currentTheme() === 'dark');

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
