/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidazioneGraficoComponent } from './validazione-grafico.component';
import { GraficoModule } from '../grafico/grafico.module';

@NgModule({
  declarations: [ValidazioneGraficoComponent],
  imports: [
    CommonModule,
    GraficoModule,
   
],
  exports: [ValidazioneGraficoComponent],
})
export class ValidazioneGraficoModule {}
