/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidazioneGraficoModule } from './components/validazione-grafico/validazione-grafico.module';
import { ValidazioneDettaglioModule } from './components/validazione-dettaglio/validazione-dettaglio.module';
import { ValidazioneParametriModule } from './components/validazione-parametri/validazione-parametri.module';
import { MatTableModule } from '@angular/material/table';
import { EchartsxModule } from 'echarts-for-angular';
import { GraficoModule } from './components/grafico/grafico.module';
import { DialogParametersComponent } from './components/dialogs/dialog-parameters/dialog-parameters.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogInitConfigComponent } from './components/dialogs/dialog-init-config/dialog-init-config.component';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatExpansionModule } from '@angular/material/expansion';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { DialogColorPickerComponent } from './components/dialogs/dialog-color-picker/dialog-color-picker.component';
import { ColorPickerModule } from '@iplab/ngx-color-picker';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatRadioModule } from '@angular/material/radio';
import { DialogExportCsvComponent } from './components/dialogs/dialog-export-csv/dialog-export-csv.component';
import { DialogInfoModule } from './components/dialogs/dialog-info/dialog-info.module';
import { DialogLinearCorrectionComponent } from './components/dialogs/dialog-linear-correction/dialog-linear-correction.component';
import { DialogMaxMinComponent } from './components/dialogs/dialog-max-min/dialog-max-min.component';
import { DialogAnnoSelectComponent } from './components/dialogs/dialog-anno-select/dialog-anno-select.component';
import { TranslateModule } from '@ngx-translate/core';
import { DialogSettingsComponent } from './components/dialogs/dialog-settings/dialog-settings.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogTaraturaComponent } from './components/dialogs/dialog-taratura/dialog-taratura.component';
import { MatListModule } from '@angular/material/list';
import { DialogPersonalizzaPeriodoComponent } from './components/dialogs/dialog-personalizza-periodo/dialog-personalizza-periodo.component';

@NgModule({
  declarations: [
    DialogParametersComponent,
    DialogInitConfigComponent,
    DialogColorPickerComponent,
    DialogExportCsvComponent,
    DialogLinearCorrectionComponent,
    DialogMaxMinComponent,
    DialogAnnoSelectComponent,
    DialogSettingsComponent,
    DialogTaraturaComponent,
    DialogPersonalizzaPeriodoComponent
  ],
  imports: [
    MatToolbarModule ,
    CommonModule ,
    ValidazioneGraficoModule ,
    ValidazioneDettaglioModule ,
    ValidazioneParametriModule ,
    DialogInfoModule ,
    MatTableModule ,
    MatRadioModule ,
    MatDialogModule ,
    MatInputModule ,
    MatButtonModule ,
    MatOptionModule ,
    MatSelectModule ,
    MatFormFieldModule ,
    MatIconModule ,
    MatToolbarModule ,
    MatButtonToggleModule ,
    MatDatepickerModule ,
    MatExpansionModule ,
    MatNativeDateModule ,
    MatMenuModule ,
    MatSlideToggleModule ,
    ColorPickerModule ,
    FormsModule ,
    ReactiveFormsModule ,
    GraficoModule ,
    EchartsxModule ,
    TranslateModule ,
    MatTooltipModule ,
    MatListModule
  ],
  exports:[
    CommonModule,
    ValidazioneGraficoModule,
    ValidazioneDettaglioModule,
    ValidazioneParametriModule,
    GraficoModule

  ],
  providers:[]
})
export class SharedModule { }
