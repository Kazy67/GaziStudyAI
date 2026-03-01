// src/app/core/services/translation.service.ts
import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

export type SupportedLanguage = 'tr' | 'en';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly DEFAULT_LANG: SupportedLanguage = 'tr';
  private readonly LANG_KEY = 'gazi-study-ai-lang';

  private currentLangSubject = new BehaviorSubject<SupportedLanguage>(
    this.DEFAULT_LANG,
  );
  public currentLang$ = this.currentLangSubject.asObservable();

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['tr', 'en']);
    this.translate.setDefaultLang(this.DEFAULT_LANG);
    this.initLanguage();
  }

  private initLanguage() {
    const savedLang = localStorage.getItem(this.LANG_KEY) as SupportedLanguage;
    if (savedLang && (savedLang === 'tr' || savedLang === 'en')) {
      this.setLanguage(savedLang);
    } else {
      this.setLanguage(this.DEFAULT_LANG);
    }
  }

  public setLanguage(lang: SupportedLanguage) {
    this.translate.use(lang);
    localStorage.setItem(this.LANG_KEY, lang);
    this.currentLangSubject.next(lang);

    // Set HTML lang attribute
    document.documentElement.lang = lang;
  }

  public getCurrentLang(): SupportedLanguage {
    return this.currentLangSubject.value;
  }
}
