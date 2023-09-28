/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
 import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImpostazioniComponent } from './impostazioni.component';


const routes: Routes = [{ path: '', component: ImpostazioniComponent }];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ImpostazioniRoutingModule { }
