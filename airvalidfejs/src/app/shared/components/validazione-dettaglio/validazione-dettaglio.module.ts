/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {ValidazioneDettaglioComponent} from './validazione-dettaglio.component';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatPaginatorModule} from '@angular/material/paginator';
import {TranslateModule} from '@ngx-translate/core'
import {NgxSpinnerModule} from 'ngx-spinner';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {PipesModule} from "../../../core/pipes/pipes.module";


@NgModule({
  declarations: [ValidazioneDettaglioComponent],
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatIconModule,
    MatTooltipModule,
    FormsModule,
    MatMenuModule,
    MatCheckboxModule,
    MatPaginatorModule,
    TranslateModule,
    NgxSpinnerModule,
    MatSlideToggleModule,
    PipesModule
  ],
  exports:[ValidazioneDettaglioComponent]
})
export class ValidazioneDettaglioModule {}



