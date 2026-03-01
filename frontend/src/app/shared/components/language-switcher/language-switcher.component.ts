import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PopoverModule, Popover } from 'primeng/popover';
import {
  TranslationService,
  SupportedLanguage,
} from '../../../core/services/translation.service';

interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  flag: string;
}

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, ButtonModule, PopoverModule],
  templateUrl: './language-switcher.html',
})
export class LanguageSwitcherComponent {
  @ViewChild('languagePopover') languagePopover!: Popover;
  private readonly translationService = inject(TranslationService);

  protected currentLang: SupportedLanguage = 'tr';
  protected languages: LanguageOption[] = [
    {
      code: 'tr',
      label: 'Turkce',
      flag: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f1f9-1f1f7.svg',
    },
    {
      code: 'en',
      label: 'English',
      flag: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f1ec-1f1e7.svg',
    },
  ];

  constructor() {
    this.translationService.currentLang$.subscribe((lang) => {
      this.currentLang = lang;
    });
  }

  protected changeLanguage(lang: SupportedLanguage): void {
    this.translationService.setLanguage(lang);
    this.languagePopover.hide();
  }

  protected getCurrentLanguage(): LanguageOption {
    return (
      this.languages.find((l) => l.code === this.currentLang) ||
      this.languages[0]
    );
  }

  protected toggleLanguageMenu(event: Event): void {
    this.languagePopover.toggle(event);
  }
}
