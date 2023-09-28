/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { UserSettingService } from './user-setting.service'
import { Layout } from '../../models/user-settinng.interface';

@Injectable({
  providedIn: 'root'
})
export class ThemeLayoutService {

  private currentValidazioneSubject: BehaviorSubject<Layout | undefined> = new BehaviorSubject<Layout |undefined>(undefined)
  public validazioneLayout$: Observable<Layout | undefined>;

  constructor(
    private readonly userSettingService: UserSettingService
  ) {
    this.validazioneLayout$ = this.currentValidazioneSubject.asObservable();
    this.userSettingService.getLayout().subscribe((layout) => this.setValidazioneLayout(layout));
  }

  setValidazioneLayout(value: Layout) {
    this.currentValidazioneSubject.next(value);
  }

}
