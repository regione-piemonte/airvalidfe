/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule , SETTING } from './app/app.module';
import { environment } from '@environments/environment';
import { IUserSetting } from '@models/user-settinng.interface';

if (environment.production) {
  enableProdMode();
}

let setting: Promise<IUserSetting> = fetch('./assets/json/settings.json').then((response) => response.json());
let setting2:Promise<IUserSetting>  = fetch(`${environment.apiEndpoint}preferences/reg/settings/settingapp`)
.then((response) => {
  return response!.json().then(data => {
    return JSON.parse(data.value);
  });
}).catch((e) => ({}) );
let all = Promise.all([setting, setting2])


all.then((result) => {
  platformBrowserDynamic(
    [
      { provide: SETTING, useValue: result }
    ]
  ).bootstrapModule(AppModule)
    .catch(err => console.error(err));
}).catch(err => console.error(err));

