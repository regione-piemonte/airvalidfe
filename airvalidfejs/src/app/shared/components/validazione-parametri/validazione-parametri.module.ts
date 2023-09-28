/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidazioneParametriComponent } from './validazione-parametri.component';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ColorPickerModule } from '@iplab/ngx-color-picker';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core'

@NgModule({
  declarations: [ValidazioneParametriComponent],
  imports: [CommonModule,
    MatTableModule,
    MatMenuModule,
    ColorPickerModule,
    MatButtonModule,
    MatTooltipModule,
    BrowserAnimationsModule,
    TranslateModule
  ],
  exports: [ValidazioneParametriComponent],
})
export class ValidazioneParametriModule {}
