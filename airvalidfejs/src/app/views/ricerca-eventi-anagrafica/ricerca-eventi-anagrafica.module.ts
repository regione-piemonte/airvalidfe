/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RicercaEventiAnagraficaComponent } from './ricerca-eventi-anagrafica.component';
import {RouterModule} from "@angular/router";
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { FormRicercaEventiComponent } from './form-ricerca-eventi/form-ricerca-eventi.component';
import { RisultatiRicercaComponent } from './risultati-ricerca/risultati-ricerca.component';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';

@NgModule({
  declarations: [
    RicercaEventiAnagraficaComponent,
    FormRicercaEventiComponent,
    RisultatiRicercaComponent
  ],
  imports: [
    ReactiveFormsModule,
    MatDatepickerModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    CommonModule,
    TranslateModule,
    RouterModule.forChild([
      {
        path: '' , component: RicercaEventiAnagraficaComponent
      }
    ])
  ]
})
export class RicercaEventiAnagraficaModule { }
