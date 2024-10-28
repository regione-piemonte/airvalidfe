/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ValidazioneGraficoModule} from './components/validazione-grafico/validazione-grafico.module';
import {ValidazioneDettaglioModule} from './components/validazione-dettaglio/validazione-dettaglio.module';
import {ValidazioneParametriModule} from './components/validazione-parametri/validazione-parametri.module';
import {MatTableModule} from '@angular/material/table';
import {EchartsxModule} from 'echarts-for-angular';
import {GraficoModule} from './components/grafico/grafico.module';
import {
  DialogParametersComponent,
  DialogInitConfigComponent,
  DialogColorPickerComponent,
  DialogExportCsvComponent,
  DialogLinearCorrectionComponent,
  DialogMaxMinComponent,
  DialogAnnoSelectComponent, DialogTaraturaComponent, DialogPersonalizzaPeriodoComponent, DialogRemoveParameterComponent, DialogRemoveReportComponent
} from '@dialog/*';
import {MatTabsModule} from '@angular/material/tabs';
import {MatDialogModule} from '@angular/material/dialog';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatNativeDateModule, MatOptionModule} from '@angular/material/core';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatMenuModule} from '@angular/material/menu';
import {ColorPickerModule} from '@iplab/ngx-color-picker';
import {MatButtonModule} from '@angular/material/button';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {MatRadioModule} from '@angular/material/radio';
import {DialogInfoModule} from './components/dialogs/dialog-info/dialog-info.module';
import {TranslateModule} from '@ngx-translate/core';
import {DialogSettingsComponent} from './components/dialogs/dialog-settings/dialog-settings.component';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatListModule} from '@angular/material/list';
import {DialogRenderTableModule} from './components/dialogs/dialog-render-table-component/dialog-render-table.module';
import {AccordionComponent} from './components/accordion/accordion/accordion.component';
import { DialogEventiModule } from './components/dialogs/dialog-eventi/dialog-eventi.module';
import { ReportisticaStandardComponent } from './components/dialogs/reportistica-standard/reportistica-standard.component';
import { CardAccordionReportStandardComponent } from './components/accordion/card-accordion-report-standard/card-accordion-report-standard.component';
import { StandardTableComponent } from './components/table/reportistica/standard-table/standard-table.component';
import { PipesModule } from "../core/pipes/pipes.module";
import { SpecialisticoFormComponent } from '@components/shared/dialogs/dialog-init-config/specilistico-form/specialistico-form.component';
import { ProgressModalComponent } from './components/progress-modal/progress-modal.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';


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
        DialogPersonalizzaPeriodoComponent,
        AccordionComponent,
        DialogRemoveParameterComponent,
        DialogRemoveReportComponent,
        ReportisticaStandardComponent,
        CardAccordionReportStandardComponent,
        StandardTableComponent,
        SpecialisticoFormComponent,
        ProgressModalComponent
    ],
    exports: [
        CommonModule,
        ValidazioneGraficoModule,
        ValidazioneDettaglioModule,
        ValidazioneParametriModule,
        GraficoModule,
        AccordionComponent,
        CardAccordionReportStandardComponent,
        StandardTableComponent
    ],
    providers: [],
    imports: [
        MatToolbarModule,
        CommonModule,
        MatProgressBarModule,
        ValidazioneGraficoModule,
        ValidazioneDettaglioModule,
        ValidazioneParametriModule,
        DialogEventiModule,
        DialogInfoModule,
        MatAutocompleteModule,
        MatChipsModule,
        MatTableModule,
        MatTabsModule,
        MatRadioModule,
        MatCheckboxModule,
        MatDialogModule,
        MatInputModule,
        MatButtonModule,
        MatOptionModule,
        MatSelectModule,
        MatFormFieldModule,
        MatIconModule,
        MatToolbarModule,
        MatButtonToggleModule,
        MatDatepickerModule,
        MatExpansionModule,
        MatNativeDateModule,
        MatMenuModule,
        MatSlideToggleModule,
        ColorPickerModule,
        FormsModule,
        ReactiveFormsModule,
        GraficoModule,
        EchartsxModule,
        TranslateModule,
        MatTooltipModule,
        MatListModule,
        DialogRenderTableModule,
        PipesModule
    ]
})
export class SharedModule { }
