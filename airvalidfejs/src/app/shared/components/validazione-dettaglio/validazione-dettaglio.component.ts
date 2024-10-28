/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {SelectionModel} from '@angular/cdk/collections';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild,} from '@angular/core';
import {MatMenuTrigger} from '@angular/material/menu';
import {MatTable, MatTableDataSource} from '@angular/material/table';
import {MatPaginator, MatPaginatorIntl, PageEvent} from '@angular/material/paginator';
import {MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core'
import {Store} from '@ngrx/store';
import moment from 'moment';
import {concatMap, debounceTime, delay, filter, from, iif, map, Observable, of, skip, Subject, switchMap, take, takeUntil, timer, withLatestFrom} from 'rxjs';
import {NgxSpinnerService} from 'ngx-spinner';
import { finalize, tap} from 'rxjs/operators';
import {DataService, LanguageService} from '@services/core/index';
import {DialogService} from '../dialogs/services/dialog.service';
import {DialogLinearCorrectionComponent} from '@dialog/*';
import {Dataset, IOutput} from '@models/grafico';
import {ITimeSelected, IValueDataOutput} from './models/time-selected.model';
import {AppState} from '../../../state';
import {DatasService} from '@services/core/api';
import {reloadDettaglioDettaglioAction, resetPointActionDettaglio, saveSuccessDettaglioAction, selectPointDettaglio, sendChangeMassivoDettaglioAction, setDettaglioAction,} from '@actions/*';
import {
  changePeriodoParametriSelector,
  changesMassiveSelector,
  clickOnPointSelector,
  dataPollingSelector,
  deleteParameterSelezionato,
  getSensorDataToParametroSelezionatoDettaglioSelector,
  isLengthGraficiSelector, listenChangePeriodoAndDeleteSelezionatoParametroSelector,
  parametriSelector,
  parametroSelector,
  parametroSelezionatoSelectorWithListParameters, parametroWithValidazioneStateSelector$,
  periodoGraficoSelector,
  scalaGraficoSelector,
  selectInputChangeSelector
} from '@selectors/*';
import {IGeneratePoint, ScaleEnum} from '../grafico/compositive_grafic/models';
import {IParameter} from '@models/dataService';
import {ValoriTabella} from "../../../core/components/table-example/table-example.component";
import {DateSettingService} from "@services/core/utility/date-setting.service";
import {IResponseLockWithName} from "@models/interface/BE/response/getLock";
import { MatSnackBar } from '@angular/material/snack-bar';
import {tipoTaratureSelector} from "@reducers/*";


@Component({
  selector: 'app-validazione-dettaglio',
  templateUrl: './validazione-dettaglio.component.html',
  styleUrls: ['./validazione-dettaglio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidazioneDettaglioComponent implements OnInit, OnDestroy {
  dataSourceMat = new MatTableDataSource<Dataset>();
  dataSourceMat2 = new MatTableDataSource<Dataset>();
  displayedColumns: string[] = [
    'select',
    //'giorno',
    'dataora',
    'originale',
    'validato',
    'codice',
    // 'flag',
    'validity_flag',
    'validity_flag_state',
    'verification_flag',
  ];
  pageEvent?: PageEvent;
  titleModalonKeyUpEvent = '';
  bodyModalonKeyUpEvent = '';
  clickedRows = new Set<ValoriTabella>();
  selection = new SelectionModel<ITimeSelected>(true, []);

  contextMenuPosition = {x: '0px', y: '0px'};

  parametro: string = '';
  stazione: string = '';
  unitaMisura: any = '';
  area: any;
  input!: Partial<IOutput>;
  page: number = 0;
  decimalToggle = true;

  @ViewChild(MatMenuTrigger) contextMenu?: MatMenuTrigger;
  @ViewChild('paginatorTop') topPaginator!: MatPaginator;
  @ViewChild('paginatorBottom') bottomPaginator!: MatPaginator;
  @ViewChild(MatTable) table!: MatTable<IParameter>;
  @ViewChild('table', {read: ElementRef}) tableRef?: ElementRef ;

  @Input() dataInput?: Observable<number>;
  @Output() valueDataOutput = new EventEmitter<IValueDataOutput>();

  isRelativeScale: boolean = false;
  private unsubscribe$: Subject<boolean> = new Subject();
  parametroSelezionato$ = this.storeService.select(parametroSelector);
  parametroWithValidazioneStateSelector$ = this.storeService.select(parametroWithValidazioneStateSelector$).pipe(
    // filter(item => !!item)
  );
  hasGraficoList$: Observable<boolean> = this.storeService.select(isLengthGraficiSelector);
  private _takeUntil$: Subject<boolean> = new Subject<boolean>();
  private _takeSaveSuccess$: Subject<boolean> = new Subject<boolean>();

  constructor(
    public dataService: DataService,
    private datasServiceApi: DatasService,
    private dialogService: DialogService,
    private dialog: MatDialog,
    private translateService: TranslateService,
    private languageService: LanguageService,
    private matPaginatorIntl: MatPaginatorIntl,
    private readonly spinnerService: NgxSpinnerService,
    private readonly storeService: Store<AppState>,
    private readonly dateSettingService: DateSettingService,
    private readonly ref: ChangeDetectorRef,
    private readonly _snackBar: MatSnackBar
  ) {
  }

  /**
   * @description crea un oggetto di tipo IValueDataOutput
   * @param {IValueDataOutput} {input,value,indice}
   * @return {*}  {IValueDataOutput}
   * @example
   * this._createInput({input,value,indice})
   */
  private _createInput({input, value, indice}: IValueDataOutput): IValueDataOutput {
    return {
      indice,
      value,
      input
    }
  }

  /**
   * @description Riceve un Partial<IGeneratePoint> e lo trasforma in un ITimeselected
   * @param {Partial<IGeneratePoint>} value
   * @return {*}  {ITimeSelected}
   * @example
   * let item = this._createInput({input,value,indice})
   */
  private _createITimeSelected(value: Partial<IGeneratePoint>): ITimeSelected {
    return {
      ...value.point_dataset,
      changed: false,
    }
  }

  /**
   * @description Rimane in ascolto della eliminazione del parametro
   */
  private _listenDeleteParameter() {
    return this.storeService.select(deleteParameterSelezionato)
      .pipe(
        filter((deleteParameter) => deleteParameter),
      )
      // .subscribe({
      //   next: () => {

      //   }
      // })
  }

  /**
   * Listens for changes in the 'PeriodoParametri' and returns an observable that emits values whenever a valid 'periodo' is present.
   *
   */
  private _listenChangePeriodo() {
    return this.storeService.select(changePeriodoParametriSelector).pipe(
      filter(periodo => !!periodo),
    )
  }

  private _combineDeleteParametroChangePeriodo() {
    this.storeService.select(listenChangePeriodoAndDeleteSelezionatoParametroSelector)
      .pipe(
        filter(({periodo, deleteParametro}) => !!periodo || deleteParametro),
      )
      .subscribe({
        next: ({periodo, deleteParametro}) => {
          console.info({periodo, deleteParametro}, 'Combine');
          this.dataSourceMat.data = [];
          this.table.renderRows();
        },
        error: err => console.error(err),
        complete: () => console.info('Complete')
    })
  }

  /**
   * @description Rimango in ascolto della lista parametri, quando è vuota allora devo eliminare anche il dataSource della tabella
   */
  private _listenListaParametri() {
    this.storeService.select(parametriSelector)
      .pipe(
        filter(lista => !lista && !!this.dataSourceMat.data.length)
      )
      .subscribe(data => {
        // console.info(data);
        this.dataSourceMat.data = [];
        this.table?.renderRows();
      })
  }

  /**
   * @description Riceve un array di IValueDataOutput e li emette con un delay di 600ms
   * @param {Array<IValueDataOutput>} listaEmit
   * example
   * this._emitEventToDelay(listaEmit)
   */
  private _emitEventToDelay(listaEmit: Array<IValueDataOutput>) {
    let time = listaEmit.length <= 5 ? 150 : 10;
    // console.info('time', time)
    from(listaEmit).pipe(
      concatMap((el) => of(el).pipe(delay(time))),
      finalize(() => this.spinnerService.hide('global'))
    ).subscribe((res) => this.valueDataOutput.emit(res));
  }

  /**
   * @description Rimane in ascolto del cambio scala
   */
  private _listenScaleChange() {
    this.storeService.select(scalaGraficoSelector)
      .pipe(
        filter((scala) => !!scala),
        skip(1),
        takeUntil(this._takeUntil$),
      )
      .subscribe((scale) => {
        // console.info("Valore scala", scale);
        // togliamo la selezione a tutti i punti sulla tabella nel caso che ci siano
        // this.clearAllSelection();
        this.isRelativeScale = scale === ScaleEnum.relativa;
      })
  }

  /**
   * @description Rimane in ascolto dei dataset per parametro selezionato
   */
  private _listenDatasetChange() {
    this.storeService.select(getSensorDataToParametroSelezionatoDettaglioSelector).pipe(
      filter(value => !!value),
      delay(750),
      takeUntil(this._takeUntil$),
    ).subscribe({
      next: value => {
        let {parametro, dataset} = value!;
        this.parametro = parametro?.parametro?.name ?? '';
        this.stazione = parametro?.stazione?.name ?? '';
        this.input = {dataset, parameter: parametro};
        this.dataSourceMat.data = dataset!;
        this.dataSourceMat2.data = dataset!;
        this.table.renderRows();
        this.storeService.dispatch(setDettaglioAction({valori_grafico: dataset, input: this.input}))
      }
    })
  }

  private _listenHasPolling() {

    this.storeService.select(dataPollingSelector).pipe(
      filter(value => !!value),
      withLatestFrom(this.storeService.select(parametroSelezionatoSelectorWithListParameters)),
      map(([data, {parametro: selezionato, lista}]) => ({data, parametro: lista?.find(parametro => parametro.measurementId === selezionato?.parameter.measurementId)})),
      filter(({data, parametro}) => !!data && !!parametro),
    ).subscribe({
      next: ({data, parametro}) => {
        // console.info('Has polling', data);
        // console.info('Parametro selezionato', parametro);
        this.input = {...this.input, parameter: parametro};
      }
    })
  }

  /**
   * @description Ascolto il LanguageService per la traduzione
   */
  private _listenLanguageService() {
    this.languageService.currentLanguage$
      .pipe(
        switchMap(language => this.translateService.getTranslation(language)),
        takeUntil(this._takeUntil$),
      )
      .subscribe((res) => {
        this.titleModalonKeyUpEvent = res.dialog_data_not_valid.title;
        this.bodyModalonKeyUpEvent = res.dialog_data_not_valid.body;
        this.matPaginatorIntl.itemsPerPageLabel = res.table.pagination.per_page;
        this.matPaginatorIntl.nextPageLabel = res.table.pagination.next_page;
        this.matPaginatorIntl.previousPageLabel = res.table.pagination.previous_page;
        this.matPaginatorIntl.firstPageLabel = res.table.pagination.first_page;
        this.matPaginatorIntl.lastPageLabel = res.table.pagination.last_page;
        this.matPaginatorIntl.changes.next();

      });
  }

  /**
   * @description Ascolto dei punti selezionati sul grafico
   */
  private _listenSelectPoints() {
    this.storeService.select(clickOnPointSelector)
      .pipe(
        filter((point) => !!point),
        map((point) => this._createITimeSelected(point!)),
        map((point) => this.dataSourceMat.data.findIndex(({timestamp}) => timestamp === point.timestamp)),
        filter((index) => index > -1),
        takeUntil(this._takeUntil$),
      )
      .subscribe((point) => {

        // this.topPaginator.nextPage();
        let indexPage = Math.floor(point / 24);
        if (this.topPaginator.pageIndex !== indexPage) {

          //calcolo la differenza tra la pagina corrente e quella del punto selezionato
          let diff = indexPage - this.topPaginator.pageIndex;
          // calcolo la pagina considerando che la pagina è di 24 elementi rendendolo un numero intero
          if (indexPage > this.topPaginator.pageIndex) {
            for (let i = 0; i < diff; i++) {
              this.topPaginator.nextPage();
            }
          }
          if (indexPage < this.topPaginator.pageIndex) {
            for (let i = 0; i < diff * -1; i++) {
              this.topPaginator.previousPage();
            }
          }

          this.page = indexPage;
          this.topPaginator.pageIndex = indexPage;

        }
        let data = this.dataSourceMat.data[point];
        this.selection.selected.push(data);
        this.selection.toggle(data);
        this.ref.detectChanges();
      });
  }

  /**
   * @description Ricevo i valori dell'input da far visualizzare in tabella
   */
  private _listenInputSet() {
    this.storeService.select(selectInputChangeSelector)
      .pipe(
        filter(({parameter}) => !!parameter),
        debounceTime(300),
        takeUntil(this._takeUntil$),
      )
      .subscribe((input) => {
        let {dataset, parameter, index} = input!;
        let {parametro, stazione} = parameter!;
        // setto il valori del dataset con il changed in false
        dataset = dataset?.map((data) => {
          return {
            ...data,
            changed: false,
          };
        });

        if (parametro?.key.includes('|')) {
          const anno = +parametro.key.substring(
            parametro.key.indexOf('|') + 1,
            parametro.key.length
          );
          dataset = JSON.parse(
            JSON.stringify(
              dataset?.map((x: any) => {
                return {
                  ...x,
                  changed: false,
                  timestamp: moment(x.timestamp).year(anno).valueOf(),
                };
              })
            )
          );
        }
        //
        this.dataSourceMat.data = [...dataset!]; // arrayClone.slice(0, 24)
        this.dataSourceMat.paginator = this.topPaginator;
        this.parametro = parametro ? parametro.name : '';
        this.stazione = stazione ? stazione.name : '';
        this.input = {...input, parameter, dataset, index};
        this.unitaMisura = this.dataService.getUnitMeasure(+parametro?.measureUnitId!);
        this.clearAllSelection();
        this.ref.detectChanges();
      })
  }

  /**
   * Listens for changes in the `periodoGrafico` selector and performs certain actions.
   *
   * @private
   * @returns {void}
   */
  private _listenChangePeriodoGrafico(): void {
    this.storeService.select(periodoGraficoSelector).pipe(
      skip(1),
      filter((periodo) => !!periodo),
      takeUntil(this._takeUntil$),
    ).subscribe((periodo) => {
        // console.info('periodo', periodo);
        this.clearAllSelection();
      }
    )
  }

  /**
   * @description Sets sensor data for a given key.
   *
   * @param {string} key - The key to identify the sensor data.
   * @param {ITimeSelected[]} array - An array of ITimeSelected objects representing the sensor data.
   * @returns {Observable<void>} - An Observable that emits void when the sensor data is successfully set.
   */
  private _setSensorData(key: string, array: ITimeSelected[]): Observable<number> {
    return this.datasServiceApi.setSensorData(key, array.filter(item => item.changed)).pipe(
      takeUntil(this._takeUntil$),
    );
  }

  private _subObservableSaveData(obs$: Observable<number>) {
    obs$
      .pipe(
        take(1),
        finalize(() => {
          this.spinnerService.hide('global');
        }),
      )
      .subscribe({
        next: res => {
          if (res) {
            this.dataService.clearSaveValue(); // Pulisci i dati da salvare
            this.clearAllSelection(); // Deseleziona tutti i dati
            // Apro la modale di successo
            // la modale è disattiva il feedback di success avviene tramite snackbar
            // this.dialogService.openInfoDialog(
            //   'Attenzione',
            //   'Salvataggio avvenuto con successo',
            //   undefined,
            //   'success'
            // );
            const message = this.translateService.instant('snackbar.save.success');
              this._snackBar.open(message, '', {
                duration: 1000,
                panelClass: ['snackbar--success']
              });
            // Aggiorno il dataset della tabella cambiando il valore di changed a false
            this.dataSourceMat.data = this.dataSourceMat.data.map(({changed, ...item}) => ({
              ...item,
              changed: false
            }));
            // Renderizzo i cambiamenti
            this.table.renderRows();
            this.storeService.dispatch(saveSuccessDettaglioAction({...this.input, dataset: this.dataSourceMat.data!}));
          }
        },
        error: () => {
          this.dialogService.openInfoDialog(
            'Attenzione',
            'Salvataggio non avvenuto',
            undefined,
            'error'
          );
        }
      });
  }

  ngOnInit(): void {
    this._listenScaleChange();
    this._listenListaParametri();
    // this._listenTableChange();
    this._listenInputSet();
    this._listenDatasetChange();
    // this._listenParameterChange();
    // this._listenDataInput();
    this._listenLanguageService();
    this._listenSelectPoints();
    // this._listenDeleteParameter();
    this._listenChangePeriodoGrafico();
    // this._listenHasPolling();
    this._combineDeleteParametroChangePeriodo()
  }

  openInfoDialog(title: string, message: string, actionTitle?: string, type?: string) {
    this.dialogService.openInfoDialog(title, message, actionTitle, type);
  }

  private _extractedValue(input: EventTarget, k: keyof EventTarget) {
    return input[k]
  }

  private _extractedElement(e: FocusEvent, k: keyof Event) {
    return e[k] as HTMLInputElement;
  }

  private _replaceVirgola(value: string): number {
    return +value.replace(',', '.');
  }

  /**
   * @description Metodo che viene modificato un parametro della tabella
   */
  onBlurEvent(event: FocusEvent, element: ITimeSelected, indice: number) {
    let valueHtml = this._extractedElement(event, 'target').value;

    let value = this._replaceVirgola(valueHtml);

    // verifico che sia un numero valido
    if (isNaN(value)) {
      this.openInfoDialog(this.titleModalonKeyUpEvent, this.bodyModalonKeyUpEvent, undefined, 'error');
      (event.target as HTMLInputElement).value = element.valore_validato.toString().replace('.', ',');
      throw new Error('Numero inserito non valido');
    }
    // calcolo l'indice della tabella
    let indiceTabelle = this.topPaginator.pageIndex * this.topPaginator.pageSize + indice;
    // Ricerco l'elemento per verificare che sia stato modificato
    if (this.dataSourceMat.data[indiceTabelle].valore_validato !== +value) {
      // this.spinnerService.show('global');

      // creo il nuovo elemento
      let newelement: ITimeSelected = {
        ...element,
        valore_validato: +value,
        verification_flag: 2,
        changed: true,
      }

      let el = this._createInput({indice: element.timestamp, value: newelement, input: this.input});

      this.dataSourceMat.data = this.dataSourceMat.data.map((item, i) => {
        if (i === indiceTabelle) {
          return {
            ...newelement,
          }
        }
        return item;
      });
      this.table.renderRows();

      timer(200)
        .pipe(
          map(() => el),
          finalize(() => {
            // this.spinnerService.hide('global');
            this.selection.deselect(element);
          })
        ).subscribe((res) => this.valueDataOutput.emit(res));
    }

  }

  validaTutto() {
    console.info('input', this.input);

    this.dataSourceMat.data = this.dataSourceMat.data.map(({verification_flag, tipologia_validaz, timestamp, ...item}) => {
      if (verification_flag === 3 && (tipologia_validaz != 'FFF' && tipologia_validaz != '---')) {
        verification_flag = 2;
        return {...item, timestamp, tipologia_validaz, verification_flag, changed: true};
      }
      return {...item, timestamp, tipologia_validaz, verification_flag};
    });
    // verifico che ci sia un almeno un cambio
    if (this.dataSourceMat.data.some(item => item.changed)) {

      this.table.renderRows();
      this.storeService.dispatch(sendChangeMassivoDettaglioAction(this.dataSourceMat.data!));
    }
  }

  roundNumber(number: number | undefined, decimalPlaces: number | undefined): string | null {
    if (number === null || number === undefined) {
      return null; // Restituisce null se number è null o undefined
    }

    if (decimalPlaces !== undefined) {
      const multiplier = Math.pow(10, decimalPlaces);
      const roundedNumber = Math.round(number * multiplier) / multiplier;
      return roundedNumber.toString().replace('.', ','); // Sostituisce il punto con la virgola
    } else {
      return Math.round(number).toString().replace('.', ','); // Anche in questo caso
    }
  }


  certificaTutto() {
    console.info('input', this.input);
    this.dataSourceMat.data = this.dataSourceMat.data.map(({verification_flag, tipologia_validaz, timestamp, ...item}) => {
      if (verification_flag === 2 && tipologia_validaz != 'FFF') {
        verification_flag = 1;
        return {...item, timestamp, tipologia_validaz, verification_flag, changed: true};
      }
      return {...item, timestamp, tipologia_validaz, verification_flag};
    });
    this.table.renderRows();
    this.storeService.dispatch(sendChangeMassivoDettaglioAction(this.dataSourceMat.data!));
  }

  // decertificaTutto() {
  //   console.info('input', this.input);
  //
  //   this.input.dataset!.forEach((element: any, index: number) => {
  //     if (
  //       element.verification_flag == 1 &&
  //       element.tipologia_validaz != 'FFF'
  //     ) {
  //       // if (element.verification_flag == 1 ) {
  //       element.verification_flag = 2;
  //       // element.validity_flag = -1;
  //       let el = {
  //         indice: element.timestamp,
  //         value: element, //event.target.value,
  //         input: this.input,
  //       };
  //       this.input.dataset![index].verification_flag = 2;
  //       this.valueDataOutput.emit(el);
  //     }
  //   });
  //   console.info('Decertifica tutto', this.input);
  //   //this.dataSourceMat.data = this.input.dataset;
  //
  //   this.fullArrayDataset = JSON.parse(JSON.stringify(this.input.dataset));
  //   let arrayClone = JSON.parse(JSON.stringify(this.fullArrayDataset));
  //   this.originalArrayDataset = JSON.parse(
  //     JSON.stringify(this.fullArrayDataset)
  //   );
  //   //this.dataSourceMat.data = arrayClone.slice(0, 24)
  //   this.page = 0;
  //
  //   setTimeout(() => {
  //     this.topPaginator.pageIndex = 0;
  //     this.topPaginator.length = this.fullArrayDataset.length;
  //   });
  // }

  // invalidaTutto() {
  //   console.info('input', this.input);
  //   console.info('dataset', this.fullArrayDataset);
  //   this.input.dataset!.forEach((element: any) => {
  //     if (element.verification_flag == 2 || element.verification_flag == 3) {
  //       element.verification_flag = 2;
  //       element.validity_flag = -1;
  //       let el = {
  //         indice: element.timestamp,
  //         value: element, //event.target.value,
  //         input: this.input,
  //       };
  //
  //       this.valueDataOutput.emit(el);
  //     }
  //   });
  //
  //   this.fullArrayDataset = JSON.parse(JSON.stringify(this.input.dataset));
  //   let arrayClone = JSON.parse(JSON.stringify(this.fullArrayDataset));
  //   this.originalArrayDataset = JSON.parse(
  //     JSON.stringify(this.fullArrayDataset)
  //   );
  //   //this.dataSourceMat.data = arrayClone.slice(0, 24)
  //   this.page = 0;
  //
  //   setTimeout(() => {
  //     this.topPaginator.pageIndex = 0;
  //     this.topPaginator.length = this.fullArrayDataset.length;
  //   });
  // }

  /**
   * @description Mostra il dialog per la conferma del salvataggio
   */
  openDialog() {
    this.dialogService
      .openInfoDialog(
        'Attenzione',
        'Procedere con il salvataggio dei dati?',
        'Salva',
      )
      .pipe(
        filter((res) => !!res),
        takeUntil(this._takeSaveSuccess$),
      )
      .subscribe({
        next: () => {
          this.saveData();
        }
      });
  }

  /**
   * @description Salvo i dati nel database
   */
  saveData() {
    // faccio partire lo spinner
    this.spinnerService.show('global');

    // verifico che ci siano dei dati da salvare nel dataService
    if (this.dataService.getToSaveValue().size > 0) {

      // creo un array di ITimeSelected per il salvataggio
      let array: Array<ITimeSelected> = [];

      for (let key of this.dataService.getKeysToSaveValue()) {
        // Array di Map<number, ITimeSelected> il number è il timestamp
        let newVar = this.dataService.getToSaveValueByKey(key);
        if (newVar) {
          for (let subKey of newVar!.keys()) {
            // Index del grafico nel dataService tramite key
            let indexSerie = this.dataService.getIndexParameterList(key);
            // indice del dataset nel grafico tramite subKey.timestamp
            let indexDataset = this.dataService.getDataSetByIndex(indexSerie).dataset.map(({timestamp}) => timestamp).indexOf(newVar?.get(subKey)?.timestamp!);
            // Grafico dal dataService tramite indexSeries
            let grafico = this.dataService.getDataSetByIndex(indexSerie);
            // Aggiorno il dataset del grafico con il nuovo valore
            grafico = {
              ...grafico,
              dataset: grafico.dataset.map((item, i) => {
                if (i === indexDataset) {
                  return {
                    ...item,
                    ...newVar?.get(subKey),
                    changed: false,
                  }
                }
                return item;
              })
            };
            // Aggiorno il grafico nel dataService
            this.dataService.setDataSetByIndex(indexSerie, grafico);
            // Aggiungo il valore
            array.push(newVar?.get(subKey)!);
          }
          this._subObservableSaveData(this._setSensorData(key, array));

        }
      }

    } else {
      this._subObservableSaveData(
        this.storeService.select(changesMassiveSelector)
          .pipe(
            debounceTime(500),
            switchMap((changesMassive: Dataset[]) => {
                let {parameter} = this.input!;
                return iif(() => !!changesMassive && changesMassive.length > 0,
                  this.datasServiceApi.setSensorData(parameter?.parametro?.key!, changesMassive.filter(item => item.changed)),
                  of(0).pipe(
                    finalize(() => this.spinnerService.hide('global')),
                  )
                )
              }
            ),
          )
      );
    }
  }

  onContextMenu(event: MouseEvent, item: ITimeSelected, par: IResponseLockWithName) {
    event.preventDefault();
    event.stopPropagation();
    let sub = new Subject();
    this.storeService.select(parametroSelector).pipe(
      filter((parametro) => !!parametro && !!parametro.parameter && !this.isRelativeScale && !!par.parametro?.extraInfo && par.myLock! && !par.parametro?.virtual && !!this.selection.selected.length),
      takeUntil(sub),
    ).subscribe((parametro) => {
      this.contextMenuPosition.x = event.clientX + 'px';
      this.contextMenuPosition.y = event.clientY + 'px';
      if (this.contextMenu) {
        this.contextMenu.menuData = {item: item};
      }

      this.contextMenu?.menu.focusFirstItem('mouse');
      this.contextMenu?.openMenu();

      sub.next(true);
      sub.complete();
    });
  }

  onContextMenuAction(item: any, action: string, value?: number) {
    switch (action) {
      //   Nel caso che voglia modificare il punto selezionato
      case 'correzione lineare':
        console.info('selezionate', this.selection.selected);
        this.openLinearCorrectionDialog();
        break;
      //   Nel caso che voglia validare il punto selezionato
      case 'valida':
        this.spinnerService.show('global');
        console.info('selezionate', this.selection.selected);
        let listaEmit: Array<IValueDataOutput> = [];
        this.selection.selected.forEach((element) => {
          if ((element.verification_flag == 2 || element.verification_flag == 3) && (element.tipologia_validaz !== 'FFF' && element.tipologia_validaz !== '---')) {
            element = {
              ...element,
              verification_flag: 2,
              validity_flag: value ?? 1,
              changed: true,
            }
            let el = this._createInput({indice: element.timestamp, value: element, input: this.input});
            listaEmit.push(el);

            let index = this.dataSourceMat.data!
              .map((x) => x.timestamp)
              .indexOf(element.timestamp);
            this.dataSourceMat.data![index] = element;
            this.dataSourceMat.data = [...this.dataSourceMat.data];

            // this.valueDataOutput.emit( el );
          }
        });
        if (listaEmit.length <= 5) {
          this._emitEventToDelay(listaEmit);
        } else {
          this.storeService.dispatch(sendChangeMassivoDettaglioAction(this.dataSourceMat.data!))
        }


        this.clearAllSelection();
        // this.spinnerService.hide( 'global' );
        break;
      //   Nel caso che voglia invalidare il punto selezionato
      case 'invalida':
        // Apro lo spinner
        this.spinnerService.show('global');
        console.info('selezionate', this.selection.selected);
        // Creo un array di IValueDataOutput vuoto
        let listaEmitInvalida: Array<IValueDataOutput> = [];
        // Faccio un foreach per ogni elemento selezionato
        this.selection.selected.forEach((element) => {
          if ((element.verification_flag == 2 || element.verification_flag == 3) && (element.tipologia_validaz != 'FFF' && element.tipologia_validaz != '---')) {
            // Modifico l'elemento
            element = {
              ...element,
              verification_flag: 2,
              validity_flag: value ?? -1,
              changed: true,
            }

            let el = this._createInput({indice: element.timestamp, value: element, input: this.input});
            listaEmitInvalida.push(el);
            // Index del dataSourceMat.data dove si trova l'elemento
            let index = this.dataSourceMat.data!
              .map(({timestamp}) => timestamp)
              .indexOf(element.timestamp);
            // sostituisco l'elemento con quello modificato
            this.dataSourceMat.data = [...this.dataSourceMat.data.slice(0, index), element, ...this.dataSourceMat.data.slice(index + 1)];
            // this.dataSourceMat.data![ index ] = element;
            // this.dataSourceMat.data = [ ...this.dataSourceMat.data ];
            // this.dataService.setShowNotValidList( this.input.parameter as IParameter );
            // this.valueDataOutput.emit( el );
          }
        });
        if (listaEmitInvalida.length <= 5) {
          this._emitEventToDelay(listaEmitInvalida);
        } else {
          this.storeService.dispatch(sendChangeMassivoDettaglioAction(this.dataSourceMat.data!))
        }
        // this._emitEventToDelay(listaEmitInvalida);
        this.clearAllSelection();

        break;
      /*
            case 'decertifica':
              this.spinnerService.show( 'global' );
              console.info( 'selezionate' , this.selection.selected );
              let listaEmitDecertifica: Array<IValueDataOutput> = [];
              this.selection.selected.forEach( ( element ) => {
                if ( element.verification_flag == 1 ) {
                  element = {
                    ...element ,
                    verification_flag: 2 ,
                    changed: true ,
                  };

                  let el = this._createInput( { indice: element.timestamp , value: element , input: this.input } );
                  listaEmitDecertifica.push( el );

                  let index = this.dataSourceMat.data!
                    .map( ( x ) => x.timestamp )
                    .indexOf( element.timestamp );
                  this.dataSourceMat.data![ index ] = element;
                  this.dataSourceMat.data = [ ...this.dataSourceMat.data ];

                  // this.valueDataOutput.emit( el );
                }
              } );
              this._emitEventToDelay( listaEmitDecertifica );
              this.deleteAllSelection();
              break;
      */
      case 'certifica':
        this.spinnerService.show('global');
        console.info('selezionate', this.selection.selected);
        let listaEmitCertifica: Array<IValueDataOutput> = [];

        this.selection.selected.forEach((element) => {
          if (element.verification_flag == 2) {
            element = {
              ...element,
              verification_flag: 1,
              changed: true,
            }

            let el = this._createInput({indice: element.timestamp, value: element, input: this.input});
            listaEmitCertifica.push(el);
            let index = this.dataSourceMat.data!
              .map((x) => x.timestamp)
              .indexOf(element.timestamp);
            this.dataSourceMat.data = [...this.dataSourceMat.data.map((item, i) => i === index ? element : item)];
            // this.valueDataOutput.emit( el );
          }
        });
        if (listaEmitCertifica.length <= 5) {
          this._emitEventToDelay(listaEmitCertifica);
        } else {
          this.storeService.dispatch(sendChangeMassivoDettaglioAction(this.dataSourceMat.data!))
        }
        // this._emitEventToDelay(listaEmitInvalida);
        this.clearAllSelection();

        break;
      case 'reset misurato':
       // Cerco nella data della tabella gli index dei selezionati
        this.dataSourceMat.data = this.dataSourceMat.data.map((element, i, list) => {
          if (this.selection.selected.some(item => item.timestamp == element.timestamp)) {
            return {
              ...element,
              valore_validato: element.valore_originale,
              changed: true,
            }
          }
          return element;
        })
        this.storeService.dispatch(sendChangeMassivoDettaglioAction(this.dataSourceMat.data));
        break;
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSourceMat.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
      if(this.isAllSelected()){
        this.selection.clear();
      }
      else{
        this.dataSourceMat.data.forEach((row) => this.selection.select(row));
        let {top, left, ...rec} = this.tableRef?.nativeElement.getBoundingClientRect();

        this.contextMenuPosition = {
          x: `${left+50}px`,
          y: `${top+20}px`
        }
        this.contextMenu?.menu.focusFirstItem('mouse');
        this.contextMenu?.openMenu();
      }

  }

  /**
   * @description Pulisce tutte le selezioni in tabella (checkbox)
   */
  clearAllSelection() {
    this.selection.clear();
    this.storeService.dispatch(resetPointActionDettaglio());
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }

  validityStateTooltip(element: number): string {

    switch (element) {
      case 1:
        return 'Valido';

      case 2:
        return 'Valido ma sotto il limite di rilevabilità (DL)';

      case 3:
        return 'Valido ma sotto il limite di rilevabilità (DL) e rimpiazzato con DL/2';

      case -99:
        return 'Non valido perchè lo strumento è in manutenzione o in calibrazione';

      case -1:
        return 'Non Valido';

      default:
        return element?.toString();
    }
  }

  trackElement(index: number, item: Dataset): number {
    return item.timestamp;
  }

  // onPaginate(event: any) {
  //   console.info('event', event);
  //   let arrayClone = JSON.parse(JSON.stringify(this.fullArrayDataset));
  // }

  /**
   * @description Ricarica i dati originali
   */
  loadOriginalData() {
    // Errore nel caso che non ci sia l'input
    if (!this.input) {
      this.dialogService.openInfoDialog('Attenzione', 'Nessun dato da caricare', 'Ok');
      throw new Error('Nessun dato da caricare');
    }
    // Aprire la modal che chiede se si vuole caricare i dati
    this.dialogService
      .openInfoDialog(
        'Attenzione',
        'Procedere con il caricamento dei dati?',
        'Ricarica'
      )
      .pipe(
        takeUntil(this._takeUntil$),
      )
      .subscribe((res) => {
        if (res) {
          console.info('load', this.input);
          console.info('loadDataset', this.dataService.getDataset());
          this.storeService.dispatch(reloadDettaglioDettaglioAction(this.input.parameter!));
          this.dataService.clearSaveValue();
          this.clearAllSelection();
          this.dataService.reloadParameter(this.input);
        }
      });
  }

  // setSelection() {
  //   console.info('selection', this.selection);
  //   this.selection.select(...this.dataSourceMat.data.slice(0, 10));
  // }

  public handlePageTop(e: PageEvent) {
    // Prima devo verificare che non ci siano cambi nella pagina


    let {pageSize} = e;
    this.pageEvent = e;

    // this.bottomPaginator.pageSize = pageSize;
    //
    // if (!this.topPaginator.hasNextPage()) {
    //   this.bottomPaginator.lastPage();
    // } else if (!this.topPaginator.hasPreviousPage()) {
    //   this.bottomPaginator.firstPage();
    // } else {
    //   if (this.topPaginator.pageIndex < this.bottomPaginator.pageIndex) {
    //     this.bottomPaginator.previousPage();
    //   } else if (this.topPaginator.pageIndex > this.bottomPaginator.pageIndex) {
    //     this.bottomPaginator.nextPage();
    //   }
    // }
  }

  public handlePageBottom(e: PageEvent) {
    this.pageEvent = e;
    if (!this.bottomPaginator.hasNextPage()) {
      this.topPaginator.lastPage();
    } else if (!this.bottomPaginator.hasPreviousPage()) {
      this.topPaginator.firstPage();
    } else {
      if (this.bottomPaginator.pageIndex < this.topPaginator.pageIndex) {
        this.topPaginator.previousPage();
      } else if (this.bottomPaginator.pageIndex > this.topPaginator.pageIndex) {
        this.topPaginator.nextPage();
      }
    }
  }

  /**
   * @description Apre il dialog per correggere linearmente dei dati
   */
  openLinearCorrectionDialog() {
    let dialogConfig = new MatDialogConfig();
    dialogConfig = {
      ...dialogConfig,
      disableClose: true,
      autoFocus: true,
      data: {
        id: 1,
        title: 'Selezione parametri',
      },

    };
    const dialogRef: MatDialogRef<DialogLinearCorrectionComponent, {
      slope: string;
      offset: string
    }> = this.dialog.open(
      DialogLinearCorrectionComponent,
      dialogConfig
    );

    dialogRef
      .afterClosed()
      .pipe(
        switchMap((res) => {
          return this.storeService.select(parametroSelector).pipe(
            map((parametro) => ({res, parametro}))
          )
        }),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(({res: data, parametro}) => {

        let listValueInput: Array<IValueDataOutput> = [];

        if (data) {
          this.spinnerService.show('global');

          const filteredArray = this.selection.selected
            .filter(({tipologia_validaz, verification_flag}) => tipologia_validaz != 'MMM' && tipologia_validaz != 'FFF' && verification_flag !== 1)

          filteredArray.forEach((element) => {
            if (element.verification_flag !== 1) {
              element = {
                ...element,
                valore_validato: parseFloat(parseFloat(String(element.valore_validato * this._replaceVirgola(data.slope) + this._replaceVirgola(data.offset))).toFixed((parametro?.parameter.parametro.decimalDigits ?? 0) + 2)),
                verification_flag: 2,
                changed: true,
              }

              let el = this._createInput({indice: element.timestamp, value: element, input: this.input});
              listValueInput.push(el);

              let index = this.dataSourceMat.data!.map(({timestamp}) => timestamp).indexOf(element.timestamp);
              this.dataSourceMat.data = this.dataSourceMat.data.map((item, i) => {
                if (i === index) {
                  return {
                    ...element,
                  }
                }
                return item;
              });
              this.table.renderRows();
            }
          });
          // Nel caso che la modifica sia minore di 5 elementi
          if (listValueInput.length > 0 && listValueInput.length < 5) {
            from(listValueInput).pipe(
              concatMap(item => of(item).pipe(delay(listValueInput.length >= 5 ? 50 : 100))),
              finalize(() => this.spinnerService.hide('global')),
            ).subscribe((res) => this.valueDataOutput.emit(res));
          } else {
            // emetto un valore per il cambio massivo del grafico
            this.storeService.dispatch(sendChangeMassivoDettaglioAction(this.dataSourceMat.data))
          }
          this.unsubscribe$.next(true);
          this.spinnerService.hide('global');

        }
        this.clearAllSelection();
      });
  }

  taraturaParametri() {
    // Dobbiamo richiedere la taratura del periodo selezionato
    console.info('Taratura parametri');
    this.dialogService.openDialogTaratura('Applica')
      .pipe(
        filter((res) => !!res),
        withLatestFrom(this.storeService.select(tipoTaratureSelector)),
        map(([{end, start}, tipo]) => ({start, end, tipo})),
        tap(() => this.spinnerService.show('global')),
        switchMap(({start, end, tipo}) => this.datasServiceApi.setMeasureCorrection(this.input.parameter?.parametro?.key ?? '', start, end, 'cop',tipo)),
        takeUntil(this._takeUntil$),
      )
      .subscribe({
        next: data => {

          let dataSet: Array<Dataset> = [];

          // Utilizzo di findIndex per individuare la posizione del primo elemento con timestamp corrispondente
          let findIndex = this.input?.dataset!.findIndex(item => item.timestamp - (60*60*1000) === data[0].timestamp);


          for (let i = 0; i < data.length; i++) {

            // Trova la posizione del dataset corrispondente utilizzando l'indice trovato
            let dataset = this.input.dataset![i + findIndex];
            // Verifico che il valore del dataset non sia flag 2 e che sia diverso da FFF
            if (dataset.verification_flag === 2 && dataset.tipologia_validaz !== 'FFF') {
              let {valore_validato: taratura} = data[i];

              dataset = {
                ...dataset,
                valore_validato: taratura,
                changed: true
              };

              this.input.dataset![i + findIndex] = {
                ...this.input.dataset![i + findIndex],
                ...dataset,
              }

              this.dataSourceMat.data[i + findIndex] = {
                ...this.input.dataset![i + findIndex],
                ...dataset
              }

              dataSet.push(dataset);
            }
          }

          // finisce di modificare il valore dell'input e mandiamo modifica massiva
          this.storeService.dispatch(sendChangeMassivoDettaglioAction(dataSet));
          this.spinnerService.hide('global');
          this.dataSourceMat.data = [...this.dataSourceMat.data];
          this.table.renderRows();
          this.ref.detectChanges();
        }
      });
  }

  selectRow(row: ITimeSelected) {
    this.storeService.dispatch(selectPointDettaglio(row))
    // this.selection.toggle( row );
  }

  // checkChanged(): boolean {
  //   let some = !this.dataSourceMat.data.some(item => item.changed);
  //   return some ?? true;
  // }

  ngOnDestroy() {
    this._takeUntil$.next(true);
    this._takeUntil$.complete();
  }

  hasCheckbox(row: ITimeSelected): boolean {
    let valoriInvalidi = ['MMM', 'FFF', '---'];
    let hasTipologia = !valoriInvalidi.includes(row.tipologia_validaz);
    return hasTipologia && row.verification_flag != 1 && !!this.input?.parameter?.parametro?.extraInfo?.length

  }

  createClassToElement({tipologia_validaz, verification_flag, validity_flag, flag_validaz_autom}: ITimeSelected): string {

    let isTipologiaValidazFFF = tipologia_validaz == 'FFF';
    let notTreVerificationFlag = verification_flag != 3;
    let isAutomaticValidationFlag = !flag_validaz_autom;
    let isValidityFlagPositive = validity_flag > 0;
    return isTipologiaValidazFFF ? 'state-color--grey' : notTreVerificationFlag ? 'state-color--' + validity_flag : isAutomaticValidationFlag || isValidityFlagPositive ? 'state-valid--' + validity_flag : 'state-invalid--' + validity_flag;
  }

  isSelected(row: ITimeSelected): boolean {
    return this.selection.isSelected(row);
  }

  hasDisableInput(element: Dataset, par: IResponseLockWithName) {
    return this.decimalToggle || element.tipologia_validaz == 'FFF' || element.tipologia_validaz == 'MMM' || element.tipologia_validaz === '---' || !par.parametro?.extraInfo?.includes('write') || !par.myLock || element.verification_flag == 1 || this.isRelativeScale
  }

  getUTC(timestamp: number) {
    // Creo la data dal timestamp
    const date = new Date(timestamp );
    // Creo l'ora UTC
    let utcHours = date.getUTCHours() + 1;
    // MAndo in visualizzazione l'ora UTC
    // return `${(utcHours < 10 ? '0' : '') + utcHours}: ${(date.getUTCMinutes() < 10 ? '0' : '') + date.getUTCMinutes()}`;
    return this.dateSettingService.generateNameToTimeStamp({timestamp, separatore: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'});
  }
}
