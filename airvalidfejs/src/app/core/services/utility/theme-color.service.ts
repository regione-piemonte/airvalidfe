/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserSettingService } from './user-setting.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeColorService {
  private themeColorSubject: BehaviorSubject<string>;
  public currentColor$: Observable<string>;
  

  constructor(
    private readonly userSettingService: UserSettingService ,
  ) {
    this.themeColorSubject = new BehaviorSubject<string>('light');
    this.currentColor$ = this.themeColorSubject.asObservable();

    this.userSettingService.getTheme().subscribe((theme) => this.setThemeColor(theme));
  }

  setThemeColor(value: string) {
    this.themeColorSubject.next(value);
  }

}
