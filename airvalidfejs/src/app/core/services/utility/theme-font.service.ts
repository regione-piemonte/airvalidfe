/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs'
import { UserSettingService } from './user-setting.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeFontService {
  private themeFontSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public currentFont$ = this.themeFontSubject.asObservable();

  themeFontPrec: string = '';

  constructor(private readonly userSettingService: UserSettingService) {


    this.userSettingService.getFont().subscribe((font) => this.setThemeFont(font));
   }

  setThemeFont(value: string) {
    const bodyFontSize = document.getElementById('app-ariaweb');
    this.currentFont$.subscribe((value) => {
      this.themeFontPrec = value
    })
    bodyFontSize?.classList.remove('font-size--' + this.themeFontPrec);
    bodyFontSize?.classList.add('font-size--' + value);
    this.themeFontSubject.next(value);
  }

}
