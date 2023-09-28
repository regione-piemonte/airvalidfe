/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { LoginComponent } from './login/login.component';
import { AngularSplitModule } from 'angular-split';
import { ValidazioneComponent } from './validazione/validazione.component';
import { ReportisticaComponent } from './reportistica/reportistica.component';
import { ElaborazioniComponent } from './elaborazioni/elaborazioni.component';
import { ImpostazioniComponent } from './impostazioni/impostazioni.component';
import { ImpostazioniModule } from './impostazioni/impostazioni.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [LoginComponent, ValidazioneComponent, ImpostazioniComponent, ReportisticaComponent, ElaborazioniComponent],
  imports: [
    CommonModule,
    SharedModule,
    AngularSplitModule,
    ImpostazioniModule,
    TranslateModule
  ],
})

export class ViewsModule {}
