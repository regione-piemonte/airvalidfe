/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidazioneRoutingModule } from './validazione-routing.module';

@NgModule({
  declarations: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    ValidazioneRoutingModule,
  ]
})
export class ValidazioneModule { }
