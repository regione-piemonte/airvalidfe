/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRenderTableComponent } from '@dialog/*';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { TriggerMenuElaborazioneComponent } from '../../trigger-menu/trigger-menu-elaborazione/trigger-menu-elaborazione.component';
import { TriggerMenuReportisticaComponent } from './../../trigger-menu/trigger-menu-reportistica/trigger-menu-reportistica.component';

@NgModule({
  declarations: [
    DialogRenderTableComponent,
    TriggerMenuElaborazioneComponent,
    TriggerMenuReportisticaComponent,
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    TranslateModule.forRoot(),
    MatIconModule,
    MatMenuModule,
  ],

  exports: [
    DialogRenderTableComponent,
    TriggerMenuElaborazioneComponent,
    TriggerMenuReportisticaComponent,
  ],
})
export class DialogRenderTableModule {}
