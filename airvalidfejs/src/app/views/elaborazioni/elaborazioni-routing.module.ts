/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ElaborazioniComponent } from './elaborazioni.component';
import {SpecialisticoReportComponent} from "@views/elaborazioni/specialistico-report/specialistico-report.component";
import {GraficoResolver} from "@components/shared/dialogs/services/grafico-resolver.service";


const routes: Routes = [
  { path: '', component: ElaborazioniComponent },
  {
    path: 'specialistica', component: SpecialisticoReportComponent,
    resolve: {
      grafici: GraficoResolver
    }
  }];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ElaborazioniRoutingModule {}
