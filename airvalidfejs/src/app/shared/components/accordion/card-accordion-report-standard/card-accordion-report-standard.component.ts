import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatAccordion} from '@angular/material/expansion';
import {Header, Table} from '@models/response/report.interface';
import {TranslateService} from '@ngx-translate/core';
import {IPeriod} from '../accordion/accordion.component'
import {ExportCsvService} from "@services/core/utility/export-csv.service";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {DialogExportCsvComponent} from "@dialog/*";
import {IFormatExport} from "@models/validazione";
import {filter, map} from "rxjs";

@Component({
  selector: 'app-card-accordion-report-standard',
  templateUrl: './card-accordion-report-standard.component.html',
  styleUrls: ['./card-accordion-report-standard.component.scss'],
})
export class CardAccordionReportStandardComponent implements OnInit {
  @ViewChild(MatAccordion) accordion!: MatAccordion;
  @Input() header!: Header[];
  @Input() tabelle!: Table[];
  @Input() formato!: any;
  @Input() type!: string;
  @Input() period!: IPeriod;

  private translationMap: { [title: string]: string } = {
    AnnualSynth8HoursTable: 'reportistica.standard.AnnualSynth8HoursTable',
    AnnualSynthDailyParamsTable: 'reportistica.standard.AnnualSynthDailyParamsTable',
    AnnualSyntheticTable: 'reportistica.standard.AnnualSyntheticTable',
    DailyTable: 'reportistica.standard.DailyTable',
    DayMedium8HoursTable: 'reportistica.standard.DayMedium8HoursTable',
    DayMediumTable: 'reportistica.standard.DayMediumTable',
    DaysOfWeekTable: 'reportistica.standard.DaysOfWeekTable',
    DaysWeekDailyParamsTable: 'reportistica.standard.DaysWeekDailyParamsTable',
    EightHoursChartTable: 'reportistica.standard.EightHoursChartTable',
    HoursChartTable: 'reportistica.standard.HoursChartTable',
    HoursMediumSyntheticTable: 'reportistica.standard.HoursMediumSyntheticTable',
    HoursMediumTable: 'reportistica.standard.HoursMediumTable',
    MediumDailyParamsTable: 'reportistica.standard.MediumDailyParamsTable',
    MonthsMedium8HoursTable: 'reportistica.standard.MonthsMedium8HoursTable',
    MonthsMediumDailyParamsTable: 'reportistica.standard.MonthsMediumDailyParamsTable',
    MonthsMediumTable: 'reportistica.standard.MonthsMediumTable',
    PercentilesDailyParamsTable: 'reportistica.standard.PercentilesDailyParamsTable',
    PercentilesTable: 'reportistica.standard.PercentilesTable',
    SynthDailyParamsTable: 'reportistica.standard.SynthDailyParamsTable',
    Synthetic8HoursTable: 'reportistica.standard.Synthetic8HoursTable',
    SyntheticTable: 'reportistica.standard.SyntheticTable',
    DailyParamsDefTable: 'reportistica.standard.DailyParamsDefTable'
  };

  constructor(
    private readonly _translateService: TranslateService,
    private readonly exportService: ExportCsvService,
    private readonly dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
  }

  tableTypeTitle(title: string | undefined): string {
    return title ? this._translateService.instant(this.translationMap[title] || title) : '';
  }

  /**
   * Opens a dialog and returns a reference to that dialog. The dialog is of type DialogExportCsvComponent and expects
   * a data object of type IFormatExport.
   *
   * @returns {MatDialogRef<DialogExportCsvComponent, IFormatExport>} - A reference to the opened dialog.
   */
  _openDialog(): MatDialogRef<DialogExportCsvComponent, IFormatExport> {
    return this.dialog.open(DialogExportCsvComponent, {
      data: {
        id: 1,
        title: 'Esportazione Parametri',
      },
      disableClose: true,
      autoFocus: true,
    })
  }

  scaricaCsv(i: number, evento: MouseEvent) {
    evento.preventDefault();
    evento.stopPropagation();
    let selectedTable = this.tabelle.find((item, index) => index === i);
    console.info(selectedTable);
    this._openDialog().beforeClosed()
      .pipe(
        filter((data) => !!data),
        map(data => data!)
      )
      .subscribe(format => {
        console.info(format);
        this.exportService.createReportFile(selectedTable!, format)
      })
  }
}
