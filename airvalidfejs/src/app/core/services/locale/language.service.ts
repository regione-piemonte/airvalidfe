/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {UserSettingService} from '../utility/user-setting.service';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject: BehaviorSubject<string>;
  public currentLanguage$: Observable<string>;

  constructor(private translateService: TranslateService, private readonly userSettingService: UserSettingService ,) {
    this.currentLanguageSubject = new BehaviorSubject<string>('it'); // Imposta la lingua predefinita

    this.currentLanguage$ = this.currentLanguageSubject.asObservable();
    this.userSettingService.getLanguage().subscribe((lang) => this.setLanguage(lang));
  }
  setLanguage(language: string) {
    this.translateService.use(language);
    const bodyLang = document.getElementById('airvalid');
    let languageTag = language;
    if (bodyLang) {
      if(language == 'gb') languageTag = 'en-GB';
      bodyLang.lang = languageTag;
    }
    this.currentLanguageSubject.next(language);
  }
}
