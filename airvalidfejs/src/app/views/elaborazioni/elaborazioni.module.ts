/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ElaborazioniRoutingModule} from './elaborazioni-routing.module';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import { ElaborazioniGraficoComponent } from './elaborazioni-grafico/elaborazioni-grafico.component';
import {EchartsxModule} from "echarts-for-angular";
import { ParametriComponent } from './parametri/parametri.component';
import {NgxSpinnerModule} from "ngx-spinner";
import { DettaglioComponent } from './dettaglio/dettaglio.component';
import {MatTabsModule} from "@angular/material/tabs";
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { FormatTimePipe } from './format-time.pipe';
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";
import {FormsModule} from "@angular/forms";
import { MatTooltipModule } from '@angular/material/tooltip';
import { SpecialisticoReportComponent } from './specialistico-report/specialistico-report.component'
import {GraficoResolver} from "@components/shared/dialogs/services/grafico-resolver.service";
import {AngularSplitModule} from "angular-split";

@NgModule({
  declarations: [
    ElaborazioniGraficoComponent,
    ParametriComponent,
    DettaglioComponent,
    FormatTimePipe,
    SpecialisticoReportComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [
        CommonModule,
        ElaborazioniRoutingModule,
        MatMenuModule,
        MatButtonModule,
        EchartsxModule,
        NgxSpinnerModule,
        MatTabsModule,
        MatTableModule,
        MatTooltipModule,
        TranslateModule,
        MatIconModule,
        MatSelectModule,
        FormsModule,
        AngularSplitModule
    ],
  providers:[
    GraficoResolver
  ],
    exports: [
        MatMenuModule,
        ElaborazioniGraficoComponent,
        ParametriComponent,
        DettaglioComponent,
    ]
})
export class ElaborazioniModule { }
