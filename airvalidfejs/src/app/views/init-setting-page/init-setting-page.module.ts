/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {NgModule} from '@angular/core';

import {InitSettingPageComponent} from './init-setting-page.component';
import {RouterModule, Routes} from "@angular/router";
import {MatDialogModule} from "@angular/material/dialog";

const routes: Routes = [
  {
    path: '',
    component: InitSettingPageComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    MatDialogModule
  ],
  exports: [],
  declarations: [InitSettingPageComponent],
  providers: [],
})
export class InitSettingPageModule {
}
