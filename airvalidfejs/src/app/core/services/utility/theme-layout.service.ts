/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from '@angular/core';
import {BehaviorSubject, map, Observable, switchMap} from 'rxjs';
import {UserSettingService} from './user-setting.service';
import {Layout} from '@models/user-settinng.interface';
import {SettingsService} from '../api';

@Injectable({
  providedIn: 'root',
})
export class ThemeLayoutService {
  private currentValidazioneSubject: BehaviorSubject<Layout | undefined> = new BehaviorSubject<Layout | undefined>(undefined);
  public validazioneLayout$ = this.currentValidazioneSubject.asObservable();

  private currentValidazioneSubjectBody: BehaviorSubject<any | undefined> = new BehaviorSubject<any | undefined>(undefined);
  public validazioneLayoutBody$ = this.currentValidazioneSubjectBody.asObservable();

  constructor(
    private readonly userSettingService: UserSettingService,
    private settingService: SettingsService
  ) {
    this.userSettingService
      .getLayout()
      .subscribe((layout) => this.setValidazioneLayout(layout));
  }

  setValidazioneLayout(value: Layout) {
    this.currentValidazioneSubject.next(value);
  }

  setValidazioneLayoutBody() {
    this.validazioneLayoutBody$
      .pipe(
        switchMap((newLayout) => {
          return this.userSettingService.setting$.pipe(
            map((response) => {
              if (typeof this.currentValidazioneSubject.value === 'object') {
                const mergedLayout = {
                  ...response,
                  layout: {
                    ...response?.layout,
                    ...newLayout,
                  },
                };
                // console.info('mergedObject', mergedLayout);
                const body = {
                  groupId: 'settings',
                  id: 'settingapp',
                  type: 4,
                  value: JSON.stringify(mergedLayout),
                };

                this.settingService.setConfigApp(body).subscribe({
                  next: (res: any) => {
                    // console.info('res', res);
                  },
                  error: (err: any) => {
                    // console.info('res', err);
                  },
                  complete: () => {
                    // console.info('end')
                  },
                });
              }
            })
          );
        })
      )
      .subscribe();
  }

  setLayoutBody(value: any, split_area: keyof Layout) {
    const currentLayout = this.currentValidazioneSubject.value;
    const newLayout: any = { ...currentLayout };

    // Verifica se newLayout è definito
    if (newLayout) {
      newLayout[split_area] = value;

      // Aggiorna il layout nel servizio
      this.userSettingService.triggerLayoutChange(newLayout);

      // Aggiorna il layout nel BehaviorSubject solo se newLayout è definito
      this.currentValidazioneSubject.next(newLayout);
    }
  }


}
