/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraficoComponent } from './grafico.component';
import { MatTableModule } from '@angular/material/table';
import { EchartsxModule } from 'echarts-for-angular';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import { NgxSpinnerModule } from 'ngx-spinner';
import {MatSlideToggleModule} from "@angular/material/slide-toggle";


@NgModule({

    declarations: [GraficoComponent],
    imports: [
        MatMenuModule,
        CommonModule,
        MatTableModule,
        EchartsxModule,
        FormsModule,
        MatButtonToggleModule,
        MatIconModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatTooltipModule,
        MatDatepickerModule,
        MatInputModule,
        MatButtonModule,
        TranslateModule,
        NgxSpinnerModule,
        MatSelectModule,
        MatSlideToggleModule
    ],
  exports:[GraficoComponent]

})
export class GraficoModule { }
