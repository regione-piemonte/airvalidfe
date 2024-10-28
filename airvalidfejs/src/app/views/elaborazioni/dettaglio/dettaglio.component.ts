import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Store} from "@ngrx/store";
import {AppState} from "../../../state";
import {indexDettaglioElaborazioneSelector, listaGraficiElaborazioniSelector} from "@selectors/*";
import {filter, map, switchMap, take, withLatestFrom} from "rxjs";
import {NumberInput} from "@angular/cdk/coercion";
import IResponseReportistica from "@services/core/api/reportistica/models/getReportistica.model";
import {selectTableDettaglioElaborazioneAction} from "@actions/*";
import {ExportCsvService} from "@services/core/utility/export-csv.service";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {DialogExportCsvComponent} from "@dialog/*";
import {IFormatExport} from "@models/validazione";

@Component({
  selector: 'dettaglio-shared',
  templateUrl: './dettaglio.component.html',
  styleUrls: ['./dettaglio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DettaglioComponent implements OnInit {

  displayedColumns: string[] = ['data', 'valore', 'errore'];

  dettaglioGrafico$ = this.storeService.select(listaGraficiElaborazioniSelector).pipe(
    switchMap(lista => lista),
    filter(item => item.active)
  )
  indexTab: NumberInput = 0;

  constructor(
    private readonly storeService: Store<AppState>,
    private readonly ref: ChangeDetectorRef,
    private readonly csvService: ExportCsvService,
    private readonly dialog: MatDialog,
  ) {
  }

  ngOnInit(): void {
    this.storeService.select(indexDettaglioElaborazioneSelector).pipe(
      filter(data => !!data || data !== '1'),
      withLatestFrom(this.dettaglioGrafico$),
      map(([index, dettaglioGrafico]) => ({index, dettaglioGrafico})),
      filter(({dettaglioGrafico}) => !!dettaglioGrafico.data.length && !dettaglioGrafico.tipo.includes('new')),
    ).subscribe(({index, dettaglioGrafico}) => {
      let indexDettaglio = dettaglioGrafico.data.findIndex(item => item.id === index);
      if (indexDettaglio >= 0) {
        this.indexTab = indexDettaglio;
        this.ref.detectChanges();
      }

    })
  }

  changeIndex(event: number, list: Array<IResponseReportistica>) {
    // TODO da sistemare questa parte devo prendere l'index dallo store non indexTab
    if (event !== this.indexTab) {
      this.indexTab = event;
      this.storeService.dispatch(selectTableDettaglioElaborazioneAction(list[event].id!));
    }
  }

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

  /**
   * @description Creo il file csv della elaborazione
   */
  createCsv() {
    // Prendo il valore del grafico attivo
    this.storeService.select(listaGraficiElaborazioniSelector).pipe(
      take(1),
      switchMap(grafici => grafici),
      filter(grafico => grafico.active),
      switchMap(grafico => this._openDialog().afterClosed().pipe(
        map(setting => ({grafico, setting}))
      ))
    ).subscribe(({grafico, setting}) => {
      if (setting) {
        this.csvService.createFile(grafico,setting)
      }
    })
  }
}
