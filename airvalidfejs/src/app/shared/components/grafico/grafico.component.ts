/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core'
import {Store} from '@ngrx/store';

import {BarChart, LineChart} from 'echarts/charts';
import {
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent,
  VisualMapPiecewiseComponent,
} from 'echarts/components';
import {NgxSpinnerService} from 'ngx-spinner';

import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  pairwise,
  ReplaySubject,
  Subject,
  Subscription,
  switchMap,
  take,
  takeUntil,
  withLatestFrom,
} from 'rxjs';
import moment, {Moment} from 'moment';
import {addDays, differenceInCalendarDays, format, setHours, setMinutes} from 'date-fns';
import 'moment/locale/it';
import {DialogService} from '../dialogs/services/dialog.service';
import {DialogInfoComponent, DialogMaxMinComponent} from '@dialog/*';
import {Dataset, extractedIndexStartEndParamsType, IGrafico, IIndexStartEnd, IOutput, IProcessData, ITaratura, TypeScale, TypeUnion} from '@models/grafico';
import {IParameter, ObservableData} from '@models/dataService';
import {OptionGraficClass} from './compositive_grafic/optionGraficClass';
import {DatasService} from '@services/core/api';
import {ICreateItemData, IGeneratePoint, IOptionGrafic, IYAxis, PeriodType, ScaleEnum} from './compositive_grafic/models';
import {ChangeRenderParamsType, ITranslate, SelectChoiceRender} from '@models/ITranslate.interface';
import {ITimeSelected, IValueDataOutput} from '../validazione-dettaglio/models/time-selected.model';
import {AppState, IResponseLimiti} from '../../../state';
import {
  changesMassiveSelector,
  clickOnPointSelector,
  limitiValidazioneSelector,
  listGraficiSelector,
  parametroDeleted,
  parametroSelector,
  parametroSelezionatoWithReloadPeriodo,
  selectDataSetInputSelector,
  selectDataZoomWithParametro,
  selectorPointsSelector,
  selectPointsSelector,
  showValidDataWithParametroSelezionato
} from '@selectors/*';
import {addDataZoomToInstance, clickOnPoint, dataZoomAction, initGrafico, setInputChangedDettaglioAction, setPeriod, setScaleGraficoAction} from '@actions/*';
import {startWith} from "rxjs/operators";
import {ECharts} from "echarts";
import {DataService} from "@services/core/data/data.service";
import {LanguageService} from "@services/core/locale/language.service";
import {ThemeColorService} from "@services/core/utility/theme-color.service";
import {LocalService} from "@services/core/locale/local.service";
import {PollingLockService} from "@components/shared/validazione-parametri/services/polling-lock.service";
import {DateSettingService} from "@services/core/utility/date-setting.service";
import {IVisibility} from "@components/shared/dialogs/dialog-remove-parameter/dialog-remove-parameter.component";
import {UtilityClass} from "@components/shared/utily/utily.class";
import {INameColor} from "@components/shared/validazione-parametri/model/validazione-parametri.model";
import {MatSlideToggleChange} from "@angular/material/slide-toggle";

@Component({
  selector: 'app-grafico',
  templateUrl: './grafico.component.html',
  styleUrls: ['./grafico.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraficoComponent implements OnInit, OnDestroy {
  @Input() dataSetInput?: Observable<IGrafico[]>;
  @Input() visibilityNotValidDataSeries = new Observable<IVisibility | null>();
  @Input() visibilitySeries: Observable<any> = new Observable();
  @Input() deleteSeries: Observable<string | null> = new Observable();
  @Input() changeColorSeries = new Observable<INameColor>();
  @Input() changeValueInput!: Observable<IValueDataOutput>;
  @Output() outputSeries: BehaviorSubject<any> = new BehaviorSubject(null);

  arrayDateComplete: Array<any> = [];
  counter = 0;
  currentDate?: Moment;
  days = 0;
  echartsOptions: any;
  echartsOptionsOverView: any;
  startDate?: string;
  endDate?: string;
  endDatePersonalized: any;
  form!: FormGroup;
  indiceSelezionato = -1;
  min: number = 0;
  parametroSelezionato = '';
  period = 'giornaliera';
  periodSelected: PeriodType = 'full';
  readonly echartsExtentions: any[];
  scaleType: string = 'assoluta'
  showInputFondoscala: boolean = false;
  startDatePersonalized?: string | number;
  themeColorMode: any;
  selectedRenderGraph: ChangeRenderParamsType = 'notvalid';
  valoriInputGrafico: IGrafico[] = [];
  periodoDays: number = 0;
  choiceModeRender?: ReadonlyArray<SelectChoiceRender>;
  // private _colors: string[] | null = null;
  private start: number = 0;
  private end: number = 100;
  graphicOptions: OptionGraficClass = new OptionGraficClass(this.localeService, this.dateService);
  parametroSelezionato$ = this.storeService.select(parametroSelector);
  hasGrafici$ = this.storeService.select(listGraficiSelector).pipe(
    map(grafici => grafici?.length > 0)
  );
  private sub: Subscription[] = [];
  private _takeUntil$ = new Subject();
  private massivo = false;
  // Creo un replaySubject per poter ricevere i dati dallo store
  private _replaySubject$ = new ReplaySubject<Partial<IGeneratePoint>[]>(2);
  // Creo un formControl per il gropu del set period
  periodFormControl: FormControl = new FormControl('full');
  scalaFormControl: FormControl = new FormControl('assoluta');
  limitToggle: boolean = false;


  constructor(
    private dataService: DataService,
    private readonly datasService: DatasService,
    private dialogService: DialogService,
    private spinner: NgxSpinnerService,
    private translateService: TranslateService,
    private languageService: LanguageService,
    private dialog: MatDialog,
    private themeColorService: ThemeColorService,
    private readonly localeService: LocalService,
    private readonly storeService: Store<AppState>,
    private readonly pollingService: PollingLockService,
    readonly dateService: DateSettingService,
    private readonly ref: ChangeDetectorRef
  ) {
    this.echartsExtentions = [
      BarChart,
      LineChart,
      ToolboxComponent,
      DataZoomComponent,
      TooltipComponent,
      GridComponent,
      LegendComponent,
      MarkAreaComponent,
      VisualMapComponent,
      VisualMapPiecewiseComponent,
      GraphicComponent,
      MarkLineComponent
    ];
    this._replaySubject$.next([]);
    this.graphicOptions.initPeriodoFormControl(this.periodFormControl);
  }


  /**
   * @description Metodo per creazione del nome del parametro selezionato dal parametro ricevuto
   * @param  parameter {IParameter} parametro selezionato
   * @returns string nome del parametro selezionato
   * @example
   * let parametroSelezionato = this._getParametroSelezionato( parameter );
   * @output
   * 'Nome parametro - Nome stazione'
   */
  private _getParametroSelezionato(parameter: IParameter): string {
    return parameter.parametro.name + ' - ' + parameter.stazione.name;
  }

  private _getUltimateParametroSeleziona(parametro: IParameter): number {

    let name = this._getParametroSelezionato(parametro)
    return this.graphicOptions.option.series.findIndex(item => item.name === name);
  }

  /**
   * @description Metodo che prende le data dalla store per impostare la data d'inizio e fine
   */
  private _setStartAndEndDatePersonalized(personalized: boolean = true) {
    this.localeService.getTimeStore().subscribe(data => {
      let {dataInizioTime, dataFineTime} = data.periodo!;
      if (personalized) {
        this.startDatePersonalized = dataInizioTime;
        this.endDatePersonalized = dataFineTime;
      }
      if (!personalized) {
        this.startDate = this.dateService.generateNameToTimeStamp({timestamp: +dataInizioTime!});
        this.endDate = this.dateService.generateNameToTimeStamp({timestamp: +dataFineTime! + (59 * 60 * 1000)});
      }
    })
  }

  /**
   * @description Checks if the set period has been successfully selected.
   * @description Controlla se il periodo impostato è stato selezionato con successo.
   *
   * @param {PeriodType} periodo - The period to be checked.
   *
   * @return {boolean} - Returns true if the set period is successfully selected, otherwise false.
   */
  private _hasSuccessOfSetPeriod(periodo: PeriodType): boolean {
    // verifico che non ci siano dati modificati
    if (this.dataService.getToSaveValue().size > 0 || this.massivo) {
      // this.periodSelected = periodo;
      this.dialogService.openInfoDialog(
        'Attenzione',
        'Sono presenti dati modificati.<br/>Procedere con il salvataggio o ripristinare il dataset',
        undefined,
        'error'
      );
      return false;
    }


    // verifico se è stato selezionato un parametro e che non sia il periodo personalizzato
    if (this.indiceSelezionato < 0 && this.periodSelected != 'personalized') {

      this.dialogService.openInfoDialog(
        'Attenzione',
        'Non è stato selezionato alcun parametro<br/>Procedere con la selezione del parametro'
      );

      this.periodSelected = 'personalized';

      return false;
    }

    this.storeService.dispatch(setPeriod(periodo));


    return true;
  }

  /**
   * @description Returns an array of complete dates based on the given start and stop dates.
   * Optionally, a period type can be specified to filter the array.
   * @description Restituisce un array di date complete basato sulle date di inizio e fine date.
   * Opzionalmente, si può specificare un tipo di periodo per filtrare l'array.
   *
   * @param {number | string} startDate - The start date.
   * @param {string | number} stopDate - The stop date.
   * @param {PeriodType} [action] - The period type to filter the array. Optional.
   * @returns {Array<Array<any>>} - The array of complete dates.
   */
  private _getArrayDateComplete(startDate: number | string, stopDate: string | number, action?: PeriodType): Array<any[]> {
    // let number = this.graphicOptions.findIndexToName(this.parametroSelezionato);
    // let dataOfSerie = this.graphicOptions.getDataOfSerie(number);
    let {datasetOutputDettaglio} = this._getIndiceGraficoAndDataset();
    return action && action === 'full' ? datasetOutputDettaglio.map(item => ([...item.value!])) : datasetOutputDettaglio
      .filter(item => item.value![0] >= startDate && item.value![0] <= stopDate)
      .map(item => ([...item.value!]));
  }

  /**
   * @description Retrieves the index of the selected graphic and its associated dataset.
   *
   * @private
   * @returns {Object} An object containing the index of the selected graphic and the corresponding dataset.
   *                  - indiceGrafico: The index of the selected graphic.
   *                  - datasetOutputDettaglio: The dataset associated with the selected graphic.
   */
  private _getIndiceGraficoAndDataset(): { indiceGrafico: number; datasetOutputDettaglio: Partial<IGeneratePoint>[] } {
    let indiceGrafico = this.graphicOptions.findIndexToName(this.parametroSelezionato);
    let datasetOutputDettaglio = this.graphicOptions.getDataOfSerie(indiceGrafico);
    return {indiceGrafico, datasetOutputDettaglio};
  }

  /**
   * @description Sets the graphic and table based on the given period type and optional start and stop dates.
   * @param {PeriodType} event - The period type.
   * @param {number|string} [startDate] - The optional start date.
   * @param {number|string} [stopDate] - The optional stop date.
   * @return {void}
   */
  private _setGraficoAndTable(event: PeriodType, startDate?: number | string, stopDate?: number | string): void {
    let firstElementArrayDate = this.arrayDateComplete?.[0]?.[0];
    let number = this.graphicOptions.findIndexToValue(this.indiceSelezionato, firstElementArrayDate);
    let lastElementArrayData = this.arrayDateComplete[this.arrayDateComplete.length - 1]?.[0] as number;
    let numberEnd = this.graphicOptions.findIndexToValue(this.indiceSelezionato, lastElementArrayData);
    this.storeService.dispatch(addDataZoomToInstance({dataZoom: this.graphicOptions.getInstanceZoomData()}));

    this.start = this._percentualeDaIndice(number, this.graphicOptions.getSerie(this.indiceSelezionato).data?.length ?? 0);
    this.end = this._percentualeDaIndice(numberEnd, this.graphicOptions.getSerie(this.indiceSelezionato).data?.length ?? 0);
    //this.setMinMaxDataZoom();

    this.graphicOptions.setZoomDataOpt({
      startValue: event == 'personalized'
        ? this.startDatePersonalized
        : firstElementArrayDate,
      endValue:
        event == 'personalized'
          ? this.endDatePersonalized
          : lastElementArrayData,
      start: event === 'full' ? 0 : undefined,
      end: event === 'full' ? 100 : undefined,
    });


    this.graphicOptions.setRender(this.selectedRenderGraph, 0);

    let options = this.graphicOptions.option;
    this.startDatePersonalized = firstElementArrayDate;
    this.endDatePersonalized = lastElementArrayData;

    let datasetOutputDettaglio: Array<Dataset> = [];

    this._createInputDataTable(datasetOutputDettaglio, options);
    this._setMarkAreaOver(event, firstElementArrayDate, lastElementArrayData, startDate, stopDate);
    this.graphicOptions.setOption(options);
    this.graphicOptions.instance.setOption({...this.graphicOptions.option});
    // this.echartsOptions = this.graphicOptions.option;
    this._hideSpinner();
  }

  /**
   * @description Sets the mark area over the chart.
   *
   * @param {PeriodType} event - The type of period for the mark area. Possible values are 'full' or 'partial'.
   * @param {number} [firstElementArrayDate] - The start date for the mark area (only used for 'full' event type).
   * @param {number} [lastElementArrayData] - The end date for the mark area (only used for 'full' event type).
   * @param {string|number} [startDate] - The start date for the mark area (only used for 'partial' event type).
   * @param {string|number} [stopDate] - The end date for the mark area (only used for 'partial' event type).
   *
   * @return {void}
   */
  private _setMarkAreaOver(event: PeriodType, firstElementArrayDate?: number, lastElementArrayData?: number, startDate?: string | number, stopDate?: string | number): void {
    this.graphicOptions.optionOver.series.map((element: any, i: number, list: Array<any>) => {
      list[i].markArea.data = [];
    });

    let newVar = event === 'full' ? [{xAxis: undefined}, {xAxis: undefined}] : [{xAxis: +startDate!}, {xAxis: +stopDate!}];
    // this._createGraficoAfterItemSelect( this.indiceSelezionato , this.dataService.getDataset()[ this.indiceSelezionato ]?.parametro! );

    this.graphicOptions.optionOver.series[0].markArea!.data = [newVar];
    this.echartsOptionsOverView = this.graphicOptions.returnClone(this.graphicOptions.optionOver);
  }

  /**
   * @description Private method to create the input data table.
   * @param {Array<Dataset>} datasetOutputDettaglio - The output dataset for details.
   * @param {IOptionGrafic} options - The graphic options.
   */
  private _createInputDataTable(datasetOutputDettaglio: Array<Dataset>, options: IOptionGrafic) {
    function filterDataset(dataset: Array<Dataset>, listaDate: ReadonlyArray<number[]>) {
      if (!listaDate.length) {
        throw new Error('Lista date vuota');
      }
      let firstDataElement = listaDate[0][0];
      let lastDataElement = listaDate[listaDate.length - 1][0];
      return dataset.filter((data) => data.timestamp >= firstDataElement && data.timestamp <= lastDataElement
      );
    }

    if (this.indiceSelezionato > -1) {
      let graficoSelezionato = this.valoriInputGrafico.find(({name}) => name == this.parametroSelezionato);
      if (!graficoSelezionato) {
        throw new Error('Grafico non trovato');
      }
      datasetOutputDettaglio = this.graphicOptions.returnClone(filterDataset(graficoSelezionato?.dataset, this.arrayDateComplete));

      let output: IOutput = {
        dataset: datasetOutputDettaglio,
        index: 0,
        parameter: {},
      };

      let arrayFilter: Array<IGrafico> = [];
      this.valoriInputGrafico.forEach((element: IGrafico) => {
        let el = {...element};
        el.dataset = this.graphicOptions.returnClone(filterDataset(element.dataset, this.arrayDateComplete));
        arrayFilter.push(el);
      });
      output.parameter = graficoSelezionato;

      if (options.legend?.selected[graficoSelezionato.name]) {
        // options.series[ this.indiceSelezionato ].showSymbol = arrayFilter && arrayFilter[ 0 ].dataset.length < 96;
        //this._createGraficoAfterItemSelect( this.indiceSelezionato , graficoSelezionato , arrayFilter[ 0 ].dataset );

        this.echartsOptions = {...options};

        this.dataService.setDatasetFiltered(arrayFilter);
        if (this.parametroSelezionato && this.parametroSelezionato != '') {
          // console.info('Output', output);
          this.dataService.setParametersList(output);
          this.storeService.dispatch(setInputChangedDettaglioAction(output));
          // console.info('seriessss', this.echartsOptions.series);
        }
      }
    }
  }

  /**
   * @description Calculates the start and end timestamps based on the given parameters.
   *
   * @param {number} indexStart - The start index.
   * @param {number} indexEnd - The end index.
   * @param {number} lunghezza - The length of the dataset.
   * @param {number} [index=0] - The index of the dataset.
   * @returns {object} - The start and end timestamps.
   */
  private _startAndEndTime(indexStart: number, indexEnd: number, lunghezza: number, index: number = 0): { timestamp: number; timestampEnd: number } {
    let timestamp = this.dataService.getDataset()[index].dataset[indexStart].timestamp;
    let timestampEnd = this.dataService.getDataset()[index].dataset[indexEnd === lunghezza ? indexEnd - 1 : indexEnd].timestamp;
    return {timestamp, timestampEnd};
  }


  /**
   * Extracts start and end indices from the provided object and returns related information.
   *
   * @template T - The type of the input object.
   * @param  {extractedIndexStartEndParamsType<T>} e - The input object from which to extract indices.
   * @returns {IIndexStartEnd} The extracted indices and related information.
   */
  private _extractedIndexStartEnd<T>(e: extractedIndexStartEndParamsType<T>): IIndexStartEnd {
    let name = this.graphicOptions.getNameSerie(0);
    let indiceGrafico = this.valoriInputGrafico.findIndex(({name: nameGrafico}) => nameGrafico === name);
    let lunghezza = this.valoriInputGrafico[indiceGrafico].dataset.length;
    let zoomLength = e.batch?.length;
    if (zoomLength) {
      let lastBatch = e.batch[zoomLength - 1];
      return {lunghezza, indexStart: lastBatch.startValue, indexEnd: lastBatch.endValue, indiceGrafico};
    }
    this.start = e.start ? e.start : 0;
    this.end = e.end ? e.end : 100;
    let {indexStart, indexEnd} = this._startAndEndIndex(lunghezza);
    return {lunghezza, indexStart, indexEnd, indiceGrafico};
  }

  /**
   * @description Private method to calculate the start and end index based on a given length.
   *
   * @param {number} lunghezza - The length value used for index calculations.
   * @return {{indexStart: number, indexEnd: number}} - An object containing the calculated start and end indices.
   */
  private _startAndEndIndex(lunghezza: number): { indexStart: number, indexEnd: number } {
    let {end, start} = this.graphicOptions.getInstanceZoomData();
    let indexStart = this._indiceDaPercentuale(start, lunghezza);
    let indexEnd = this._indiceDaPercentuale(end, lunghezza);
    if (indexEnd === lunghezza) {
      indexEnd = indexEnd - 1;
    }
    return {indexStart, indexEnd};
  }

  /**
   * @description Calculates the index value based on a percentage.
   *
   * @private
   * @param {number} value - The percentage value.
   * @param {number} lunghezza - The total length.
   * @return {number} - The calculated index value.
   */
  private _indiceDaPercentuale(value: number, lunghezza: number): number {
    return Math.round(value * lunghezza / 100);
  }

  /**
   * @description Calculates the percentage value from an index.
   *
   * @param {number} value - The index value.
   * @param {number} lunghezza - The length value.
   * @returns {number} - The calculated percentage value.
   */
  private _percentualeDaIndice(value: number, lunghezza: number): number {
    return parseFloat((((value + 1) / lunghezza) * 100).toFixed(8));
  }

  /**
   * @description Creates an array of formatted dates based on the given day.
   *
   * @param {number} day - The number of days to calculate the dates for. Positive value to include future dates, negative value to include past dates.
   * @return {ReadonlyArray<string>} - The array of formatted dates in "DD/MM/YYYY" format.
   */
  private _createDateToPeriod(day: number): ReadonlyArray<string> {
    let array: string[] = [];
    let currentDate = moment();
    for (let i = 0; i <= Math.abs(day); i++) {
      let itemMoment = moment(this.currentDate).add(i, 'days');
      if (itemMoment.isSameOrBefore(currentDate, 'day')) {
        array.push(itemMoment.format('DD/MM/YYYY'));
      }
    }
    return array;
  }

  /**
   * @description metodo che viene chiamato per la selezione delle traccie originale o non
   * @params  event {boolean} true - originale - false - non originale
   * @returns IGrafico[] lista dei grafici
   * @example
   * 1. true - originale
   * this._getIGraficosOriginOrNot()
   * 2. false - non originale
   * this._getIGraficosOriginOrNot(false)
   *
   */
  private _getIGraficosOriginOrNot(origin: boolean = true) {
    return this.valoriInputGrafico.filter(item => origin ? item.name.endsWith('- origin') : !item.name.endsWith('- origin'));
  }

  /**
   * @description Shows the time spinner.
   *
   * @private
   * @method _showSpinner
   * @returns {void}
   */
  private _showSpinner(): void {
    this.spinner.show('time');
  }

  /**
   * @description Metodo per chiusura spinner time
   */
  private _hideSpinner(): void {
    this.spinner.hide('time');
  }

  /**
   * Selects values to insert into a table.
   *
   * @returns {Object} - An object containing the selected values.
   *   - {number} indiceGrafico - The index of the selected graphic.
   *   - {Array} timeStamps - An array of dataset objects representing the selected timestamps.
   */
  private _selectValuesToTable(): { indiceGrafico: number; timeStamps: Array<ITimeSelected> } {
    let indiceGrafico = this.valoriInputGrafico.findIndex((({name}) => name == this.parametroSelezionato));
    if (indiceGrafico >= 0) {
      let {startValue, endValue} = this.graphicOptions.getInstanceZoomData();
      this.startDatePersonalized = startValue;
      this.endDatePersonalized = endValue;
      let timeStamps = this.valoriInputGrafico[indiceGrafico].dataset.filter((data) => data.timestamp >= startValue! && data.timestamp <= endValue!);
      let output: IOutput = {
        dataset: timeStamps,
        index: indiceGrafico,
        parameter: this.valoriInputGrafico[indiceGrafico],
      };
      this.dataService.setParametersList(output);
      // Segnalo il valore nello store in modo che possa usarlo
      this.storeService.dispatch(setInputChangedDettaglioAction(output));
      return {indiceGrafico, timeStamps};
    }
    return {indiceGrafico: -1, timeStamps: []};
  }

  /**
   * @description Observable che riceve i dati dallo store, quando cambiano i valori nella tabella in dettaglio
   *
   * 1. Aggiorna il valore del dettaglio
   * 2. Aggiorna il valore del size nel grafico
   */
  private _listenChangeValueDettaglioStore(): void {
    let valoriGrafico$ = this.storeService.select(selectDataSetInputSelector)
      .pipe(
        filter(data => !!data?.length),
        // delay( 300 ) ,
      )
    let ricaricaSelector = this.storeService.select(listGraficiSelector)
      .pipe(
        // delay( 300 ) ,
      )
    let parametro = this.storeService.select(parametroSelector).pipe(
      // delay( 300 ) ,
    )
    this.sub = [combineLatest(
      valoriGrafico$,
      ricaricaSelector,
      parametro,
      (data, grafici, parametro) => ({data, grafici, parametro})
    )
      .pipe(
        filter(({parametro}) => !!parametro),
        debounceTime(550),
      )
      .subscribe({
        next: ({data}) => {
          this.graphicOptions.setSymbolSizeWithValue(data?.length ?? 0, this.indiceSelezionato);
          this.echartsOptions = {...this.graphicOptions.option};
          this._hideSpinner();
          this.ref.detectChanges();
        },
      })];
  }

  /**
   * @description Listen change click on point
   */
  private _listenClickOnPoint(): void {
    this.storeService.select(clickOnPointSelector)
      .pipe(
        filter(data => !!data),
        map(data => this.graphicOptions.getIndexDataset(data!)),
        filter(data => data > -1),
        takeUntil(this._takeUntil$),
      )
      .subscribe({
        next: data => {
          // console.info(data);
          this.graphicOptions.setBorderWidth(data);
          this.echartsOptions = {...this.graphicOptions.option};
        }
      });
  }

  /**
   * Listens for changes in data zoom with selected parameters.
   * @private
   * @returns {void}
   */
  private _listenChangeDataZoomWithParametroSelezionato(): void {
    this.storeService.select(selectDataZoomWithParametro)
      .pipe(
        filter(({start, end}) => !!start && !!end),
        debounceTime(500),
        takeUntil(this._takeUntil$),
      )
      .subscribe({
        next: ({end, start, parametro_selezionato}) => {
          if (!parametro_selezionato && start && end) {
            this.echartsOptionsOverView.series.forEach((element: any, i: number, list: Array<any>) => {
              element.markArea.data = [];
              if (i === 0) {
                let {startValue, endValue} = this.graphicOptions.getInstanceZoomData();
                list[i].markArea!.data = [[{xAxis: startValue}, {xAxis: endValue}]];
              }
            });
            this.echartsOptionsOverView = {...this.echartsOptionsOverView};
          }
        },
      })
  }

  /**
   * @description Listens for the evento parametroDeleted and updates the theme and other options based on the deleted parametro.
   * It also removes the parametro from the graphicOptions, echartsOptions, echartsOptionsOverView, and valoriInputGrafico.
   * Lastly, it checks if there are no more series left and sets the periodSelected to 'full' if that's the case.
   *
   * @private
   * @returns {void}
   */
  private _listenDeleteParametro(): void {
    this.storeService.select(parametroDeleted)
      .pipe(
        filter(data => !!data),
        takeUntil(this._takeUntil$),
      )
      .subscribe({
        next: data => {
          this.updateTheme();
          // nel caso stia eliminando un parametro selezionato allora devo resettare il markArea nuovamente su notvalid
          if (data?.selected) {
            this.selectedRenderGraph = 'notvalid';
            this.indiceSelezionato = -1;
            this.clearRender();
          }

          let name = this._getParametroSelezionato(data!);
          let index = this.graphicOptions.findIndexToName(name);
          this.graphicOptions.removeSerie(index);
          let indexOrigin = this.graphicOptions.findIndexToName(name, {origin: true});
          this.graphicOptions.removeSerie(indexOrigin);
          let indexOverView = this.graphicOptions.findIndexToName(name, {overView: true});

          this.graphicOptions.removeSerie(indexOverView, {overView: true});

          this.echartsOptions = {...this.graphicOptions.option};

          this.echartsOptionsOverView = this.graphicOptions.returnOption({overView: true});

          // devo anche eliminare il dataset dalla lista del service
          this.dataService.deleteDataSetByIndex({name});
          this.dataService.deleteDataSetByIndex({name, origin: true});
          // devo eliminare anche da lista dei grafici
          this.valoriInputGrafico = this.dataService.getDataset();

          // verifico che le serie non siano vuote, nel caso che siano vuote allora devo settare il periodo a full
          if (!this.echartsOptions.series.length && !this.echartsOptionsOverView.series.length) {
            this.periodSelected = 'full';
          }
          this.ref.detectChanges();

        }
      });
  }

  /**
   * @description Converts start and end timestamps to Echarts format.
   *
   * @param {Object} e - The object containing the batch array of start and end values.
   *     @param {Array} e.batch - The array of start and end values.
   *         @param {number} e.batch.startValue - The start timestamp value.
   *         @param {number} e.batch.endValue - The end timestamp value.
   * @return {Object} - An object containing the start and end timestamps in Echarts format.
   *     @return {number} - The Echarts formatted start timestamp.
   *     @return {number} - The Echarts formatted end timestamp.
   */
  private _startAndEndTimeToEcharts(e: any & { batch?: Array<{ startValue: number, endValue: number }> }): { timestamp: number, timestampEnd: number } {
    let {startValue: timestamp, endValue: timestampEnd} = e.batch[e.batch.length - 1];
    return {timestamp, timestampEnd};
  }

  /**
   * Set the graphical period over.
   * Retrieves the start and end dates of the local period and assigns them to the current instance.
   *
   * @private
   *
   * @return {void}
   */
  private _setPeriodoGraficoOver(): void {
    this.localeService.getPeriodoLocalObs().subscribe(data => {
      let {startDate, endDate} = data;
      this.startDate = startDate;
      this.endDate = endDate;
    })
  }

  /**
   * @description Metodo per settare il valore del markArea sul graficoOver
   * mettendolo come valore data = []
   */
  private _resetMarkAreaSeries(): void {
    this.echartsOptionsOverView.series.forEach((element: any, i: number, list: Array<any>) => {
      list[i].markArea.data = [];
    });
  }

  /**
   * Listens for visible value changes.
   * @private
   *
   * This method subscribes to the `showValidDataWithParametroSelezionato` observable from the `storeService` and listens
   * for changes in the `parametro`, `azione`, and `stato` values. It filters out values where `parametro` and `azione` are
   * falsy values, debounces the stream for 500 milliseconds, and takes values until the `_takeUntil$` subject emits a
   * value. When a valid value is received, it logs a message to the console with the values of `parametro`, `azione`,
   * and `stato`.
   *
   * @return {void}
   */
  private _listenVisibleValue(): void {
    this.storeService.select(showValidDataWithParametroSelezionato)
      .pipe(
        filter(({parametro, azione, stato}) => !!parametro && !!azione),
        debounceTime(500),
        takeUntil(this._takeUntil$),
      )
      .subscribe(
        ({parametro, azione, stato}) => {
          // console.info('Visione o meno parametri non validi', {parametro, azione, stato});
        }
      )
  }

  /**
   * @description Rimane in ascolto del selettore per un cambio massivo
   */
  private _listenChangeMassive(): void {
    this.storeService.select(changesMassiveSelector)
      .pipe(
        // filter(data => !!data && !!data.length),
        // tap(data => console.info(data)),
        distinctUntilChanged((firstMassivo, lastMassivo) => {
          if (firstMassivo.length !== lastMassivo.length) {
            return false;
          }
          return firstMassivo.every((item, index) => {
            const currentMassivo = lastMassivo[index];
            let validato = item.valore_validato === currentMassivo.valore_validato;
            let flag = item.verification_flag === currentMassivo.verification_flag;
            let validity = item.validity_flag === currentMassivo.validity_flag;
            return validato && flag && validity;
          })
          // return firstMassivo.length === lastMassivo.length;
        }),
        withLatestFrom(this.parametroSelezionato$),
        map(([data, parametro]) => ({data, parametro})),
        takeUntil(this._takeUntil$),
      )
      .subscribe(({parametro, data: lista}) => {

        // nel caso che non ci sia lista maodificata
        if (!lista || !lista.length) {
          // console.info('Senza modifica ', lista)
          this.massivo = false;
        } else {
          // console.info('Con modifica ', lista);
          this.massivo = true;
          // Elimino valori nel dataService
          this.dataService.clearAllValue();
          let visibleNotValid = parametro?.parameter.visibleNotValid;
          // @ts-ignore
          let newPoints: Array<IGeneratePoint> = lista?.map(item => this.graphicOptions.generatePoint(item, {
            min: 0, max: 0, visualizza: visibleNotValid, isOrigin: false, notValidDataVisible: visibleNotValid, decimal: parametro?.parameter.parametro.decimalDigits
          }));

          // dovrei trovare la sezione del grafico che è stata modificata
          let {startValue, start} = this.graphicOptions.getInstanceZoomData();
          // Creo il valore da cercare
          let valoreDaCercare: number = lista[0].timestamp !== startValue ? lista[0].timestamp + (60 * 60 * 1000) : startValue! + (60 * 60 * 1000);
          // Trovo i dati della prima serie
          let dataSerieZero = this.graphicOptions.getSerie(0).data! as Array<IGeneratePoint>;
          // Cerco il primo index delle serie che corrisponde al valore del timestamp
          let firstIndex = dataSerieZero.findIndex(item => item.value[0] >= valoreDaCercare);
          // Modifica la lista corrispondente
          dataSerieZero.splice(firstIndex, lista?.length!, ...newPoints!);
          // Modifico il dataset del grafico
          this._changeValueToValoriGrafici(firstIndex, lista);
          // modifico la sezione della serie
          // modifico la sezione della serie over
          this.graphicOptions.setSerie(0, {...this.graphicOptions.getSerie(0), data: dataSerieZero});
          this.graphicOptions.setRender(this.selectedRenderGraph, this.indiceSelezionato);
          this.echartsOptions = {...this.graphicOptions.option};

          // Sistemo la parte over del grafico
          this.echartsOptionsOverView.series.find((serie: ICreateItemData<any>) => serie.name === this.graphicOptions.getSerie(0).name).data = dataSerieZero;
          this.echartsOptionsOverView = {...this.echartsOptionsOverView};

          this.spinner.hide('global');
        }
      });
  }

  /**
   * @description Metodo per cambiare il valore del dataset del grafico specifico
   * @param firstIndex {number} indice del primo elemento da modificare
   * @param lista {Dataset[]} lista dei valori da modificare
   * @example
   * this._changeValueToValoriGrafici( 0 , [ { timestamp: 1614556800000, valore_validato: 0.1 } ] );
   */
  private _changeValueToValoriGrafici(firstIndex: number, lista: Dataset[]) {
    // cambio anche la lista nella lista dei grafici
    let firstGrafico = this.valoriInputGrafico.find(item => this._getParametroSelezionato(item) === this.parametroSelezionato)!;
    // Clona l'array dataset di firstGrafico
    let dasetFirstGrafico = [...firstGrafico.dataset];
    // Modifica il dataset clonato
    dasetFirstGrafico.splice(firstIndex, lista?.length!, ...lista!);

    // Modifico la lista del grafico
    firstGrafico = {
      ...firstGrafico,
      dataset: dasetFirstGrafico
    };
    // Inserisco il grafico modificato nella lista dei grafici
    this.valoriInputGrafico = this.valoriInputGrafico.map(item => item.name === firstGrafico.name ? firstGrafico : item);
  }

  /**
   * @description Metodo che riceve un timestamp e restituisce un oggetto {timeStart, timeEnd, formatStart, formatEnd}
   * @param istartValue {number} timestamp
   * @param iendValue {number} timestamp
   * @param event {PeriodType}  1 - 3 - 7 - full - personalized - succ - prec
   * @example
   * let {timeStart, timeEnd, formatStart, formatEnd} = this._createPeriod(istartValue, iendValue, event);
   * @private
   */
  private _createPeriod(istartValue: number, iendValue: number, event: PeriodType) {
    if (['1', '3', '7', '30'].includes(event)) {
      let timeStart = setHours(setMinutes(new Date(istartValue), 1), 0).getTime();
      let timeEnd = addDays(setHours(setMinutes(new Date(timeStart), 0), 0), +event).getTime();
      // console.info('Time start', format(timeStart, 'dd/MM/yyyy HH:mm'));
      // console.info('Time end', format(timeEnd, 'dd/MM/yyyy HH:mm'));
      return {timeStart, timeEnd, formatStart: format(timeStart, 'dd/MM/yyyy HH:mm'), formatEnd: format(timeEnd, 'dd/MM/yyyy HH:mm')};
    }
    if (event === 'full') {
      let {datasetOutputDettaglio} = this._getIndiceGraficoAndDataset();
      let dataSetValue = datasetOutputDettaglio.map(item => ([...item.value!]));
      return {
        timeStart: dataSetValue[0][0],
        timeEnd: dataSetValue[dataSetValue.length - 1][0],
        formatStart: format(dataSetValue[0][0], 'dd/MM/yyyy HH:mm'),
        formatEnd: format(dataSetValue[dataSetValue.length - 1][0], 'dd/MM/yyyy HH:mm')
      };
    }
    if (event === 'personalized') {
      return {
        timeStart: this.startDatePersonalized!,
        timeEnd: this.endDatePersonalized!,
        formatStart: '',
        formatEnd: ''
      };
    }

    if (event === 'prec' || event === 'succ') {

      let daysToData = this.graphicOptions.getDaysToData(istartValue, iendValue);
      let operator = event === 'succ' ? daysToData : daysToData * -1;
      let timeStart = addDays(setHours(setMinutes(new Date(istartValue), 1), 0), operator).getTime();
      let timeEnd = addDays(setHours(setMinutes(new Date(iendValue), 0), 0), operator).getTime();
      // console.info('Time start', format(timeStart, 'dd/MM/yyyy HH:mm'));
      // console.info('Time end', format(timeEnd, 'dd/MM/yyyy HH:mm'));
      return {timeStart, timeEnd, formatStart: format(timeStart, 'dd/MM/yyyy HH:mm'), formatEnd: format(timeEnd, 'dd/MM/yyyy HH:mm')};
    }
    return {timeStart: 0, timeEnd: 0, formatStart: '', formatEnd: ''};


  }

  private _createMark(taratura: ITaratura[]) {
    let [serie, ...series] = this.echartsOptions.series;
    // console.info(series1, 'series1');
    serie = !!taratura.length ? {
      ...serie,
      markLine: {
        symbol: ['none', 'rect'],
        label: {show: false},
        //data: [{xAxis: taratura![0].beginDate}, {xAxis: taratura![1].beginDate}, {xAxis: taratura![2].beginDate}]
        data: taratura?.map(tar => ({
          xAxis: tar.beginDate + (60 * 60 * 1000),
          lineStyle: {color: tar.calibrationApplied ? '#008f39' : '#A8A8A8A8'},
          name: `Zero: ${tar.zero} \n Span: ${tar.span} \n Concentrazione: ${tar.cylinderConcentration}`,
        }))
      },
    } : {
      ...serie,
      markLine: {}
    }
    this.graphicOptions.setSeries([serie, ...series]);
    this.echartsOptions = {...this.graphicOptions.option};
    this.ref.detectChanges();
  }

  /**
   * Creates a mark line limit overlay on the echarts series based on the provided limit.
   *
   * @param {IResponseLimiti} [limit] - An optional parameter specifying the upper limits for alert (allarme)
   *                                     and caution (attenzione) thresholds.
   * @param {IParameter} parametro Parametro selezionato
   * @return {void} - This method does not return any value.
   */
  private _createMarkLimit(limit?: IResponseLimiti, parametro?: IParameter): void {
    let [serie, ...series] = this.echartsOptions.series;
    serie = !!limit ? {
      ...serie,
      markLine: {
        silent: true,
        symbol: 'none',
        data: [
          {
            yAxis: limit.allarme,
            lineStyle: {
              color: parametro?.color || '#f4b835',
              type: 'solid',
              width: 3,
            }
          },
          {
            yAxis: limit.attenzione,
            lineStyle: {
              color: parametro?.color || '#ff0000',
              width: 1
            }
          }
        ]
      }
    } : {
      ...serie,
      markLine: {}
    }
    series = Array.isArray(series) ? series.map(serie => ({...serie, markLine: {} })) : series;
    this.graphicOptions.setSeries([serie, ...series]);
    this.echartsOptions = {...this.graphicOptions.option};
    this.ref.detectChanges();
  }

  /**
   * Handles the taratura data by subscribing to the taratura observable and updating the series in the echartsOptions.
   * @returns {void}
   */
  private _handleTaraturaData(): void {
    this.dataService.taraturaObs$
      .pipe(
        filter(value => !!value && !!value.length),
        takeUntil(this._takeUntil$),
      )
      .subscribe((taratura) => {
        this._createMark(taratura!);
      });
  }

  /**
   * @description Gestisce l'input per il set di dati.
   *
   * @return {void}
   */
  private _handleDataSetInput(): void {
    this.dataSetInput?.pipe(
      filter((val) => !!val?.length),
      withLatestFrom(this.storeService.select(parametroSelezionatoWithReloadPeriodo).pipe(
      )),
      map(([grafici, {parametro, reloadPeriodo}]) => ({index: parametro?.index, parameter: parametro?.parameter, grafici, reloadPeriodo: reloadPeriodo})),
      map(({index = -1, parameter, grafici, reloadPeriodo}) => {
        if (index > -1) {
          let indiceGraficoDaParametro = grafici.findIndex(grafico => grafico.key === parameter?.parametro.key);
          let [primo, ...el]: IGrafico[] = grafici.splice(indiceGraficoDaParametro, 1);
          // verifico che il parametro è lo stesso
          if (primo.key === parameter?.parametro?.key) {
            // modifico il parametro "visibleNotValid" con il valore del parametro selezionato
            primo = {
              ...primo,
              visibleNotValid: parameter?.visibleNotValid ?? false,
              locked: parameter?.locked ?? false,
              userLock: parameter?.userLock ?? '',
            }
            el.push(primo);
            grafici = [...el, ...grafici];
          }
        }
        if (index === -1) {
          this.graphicOptions.setZoomData(0, 100);
          this.indiceSelezionato = -1;
        }

        return {
          parameter,
          index,
          grafici,
          reloadPeriodo
        }
      }),
      debounceTime(500),
      takeUntil(this._takeUntil$)
    ).subscribe(({parameter, index, grafici, reloadPeriodo}) => {
      this._showSpinner();
      this.updateTheme();
      this.massivo = false;
      this._setStartAndEndDatePersonalized(false);

      this.graphicOptions.createSeries(grafici, {parametro: parameter, index: index, decimal: -1});
      this._processGraphs(grafici);

      // Nel caso che ci sia un parametro selezionato allora dobbiamo ricaricare i valori nella tabella
      if (this.indiceSelezionato > -1) {
        this._reloadZoomData(false, parameter);
      }

      // Nel caso che sia una scala relativa allora devo calcolare i valori min e max
      if (this.scaleType === 'relativa') {
        this.graphicOptions.getAllMinMaxYAxis();
      }

      this.echartsOptions = {...this.graphicOptions.option};
      this.echartsOptionsOverView = this.graphicOptions.returnClone(this.graphicOptions.optionOver);

      this._hideSpinner();
      this.ref.detectChanges();
    });
  }

  /**
   * Reloads zoom data for the graph.
   *
   * @param {boolean} [reloadPeriodo] - Determines whether to reload period data or not.
   * @param {IParameter} [parameter] - The parameter to use for reloading the data.
   *
   * @returns {void}
   */
  private _reloadZoomData(reloadPeriodo?: boolean, parameter?: IParameter): void {
    if (!reloadPeriodo) {
      this.storeService.dispatch(addDataZoomToInstance({dataZoom: this.graphicOptions.getInstanceZoomData()}));
      this.graphicOptions.setMarkAreaOver();
      let {startValue, endValue} = this.graphicOptions.getInstanceZoomData();
      // Applico un'ora per la ricerca
      startValue = startValue + (60 * 60 * 1000);
      endValue = endValue + (60 * 60 * 1000);
      this.graphicOptions.setZoomDataOpt({startValue, endValue, end: undefined, start: undefined});
      this.graphicOptions.optionOver.series[0].markArea!.data = [[{xAxis: startValue}, {xAxis: endValue}]];
      // nel caso di elemento selezionato devo controllare se ci sono delle fasce da visualizzare
      this.graphicOptions.setRender(this.selectedRenderGraph, this.indiceSelezionato);
    } else if (reloadPeriodo) {
      let output: IOutput = {
        dataset: this.valoriInputGrafico?.find(grafico => grafico?.key === parameter?.parametro.key || parameter?.measurementId)?.dataset ?? [],
        index: this.indiceSelezionato,
        parameter: parameter!,
      };

      this.dataService.setParametersList(output);
      this.storeService.dispatch(setInputChangedDettaglioAction(output));
      this.graphicOptions.setZoomData(0, 100);
      this.graphicOptions.instance.setOption({...this.graphicOptions.option});
      let {dataZoom}: { dataZoom: Array<{ startValue: number, endValue: number }> } = this.graphicOptions.instance.getOption() as { dataZoom: Array<{ startValue: number, endValue: number }> };
      let [primo] = dataZoom;
      this.startDatePersonalized = primo.startValue;
      this.endDatePersonalized = primo.endValue;
      //   Nel caso che sia nel reaload allora devo fare nuovamente setRender
      this.graphicOptions.setRender(this.selectedRenderGraph, this.indiceSelezionato);

    }
  }

  /**
   * Process the given array of graphs.
   * Avvisa lo store che il grafico è stato inizializzato.
   * Sets the dataset and filtered dataset in the data service.
   *
   * @param {Array<IGrafico>} grafici - An array of graphs to be processed.
   *
   * @return {void}
   */
  private _processGraphs(grafici: Array<IGrafico>): void {
    this.valoriInputGrafico = this.graphicOptions.returnClone([...grafici, ...grafici.map(grafico => ({
      ...grafico,
      name: grafico.name + ' - origin'
    }))]);
    this.storeService.dispatch(initGrafico({grafici: this.valoriInputGrafico, periodo: this.periodSelected}));
    this.dataService.setDataset(this.valoriInputGrafico);
    this.dataService.setDatasetFiltered(this.valoriInputGrafico);
  }

  /**
   * Handles the visibility change of the series.
   *
   * @return {void}
   */
  private _handleVisibilityChange(): void {
    this.visibilitySeries
      .pipe(
        filter(value => !!value),
        takeUntil(this._takeUntil$),
      )
      .subscribe((val) => {
        this._showSpinner();

        if (val) {
          // let index = this.valoriInputGrafico.findIndex(({name}) => name == val);
          let index = UtilityClass.getIndex(this.valoriInputGrafico, 'name', val)

          if (!val.includes('origin')) {
            let arrayFiltered = this.dataService.getDatasetFiltered();
            // Modifico il valore della visibilità
            arrayFiltered = arrayFiltered.map((item, i) => i === index ? {...item, visible: !item.visible} : item);
            this.dataService.setDatasetFiltered(arrayFiltered);
          }

          this.graphicOptions.option.legend!.selected[val] = !(this.graphicOptions.option.legend!.selected[val]);
          let {end, start} = this.graphicOptions.getInstanceZoomData();

          this.setMinMaxDataZoom({start, end});
          this.echartsOptions = {...this.echartsOptions};
          this.echartsOptionsOverView = {...this.echartsOptionsOverView};
        }
        this._hideSpinner();
      });
  }

  /**
   * @description Funzione che cerca l'indice all'interno di una lista
   * @template T extends TypeUnion
   * @param {ReadonlyArray<T>} list lista da iterare
   * @param {string} name Nome da ricercare
   */
  private _searchIndexToList = <T extends TypeUnion>(list: ReadonlyArray<T>, name: string): number => {
    return list.map<string>((item) => item?.name ?? '').indexOf(name);
  };


  /**
   * Handles the visibility of invalid data series.
   * @returns {void}
   */
  private _handleInvalidDataSeriesVisibility(): void {
    let concatSelector = combineLatest({
        listaMassiva: this.storeService.select(changesMassiveSelector),
        parametroSelezionato: this.storeService.select(parametroSelector)
      }
    )
    this.visibilityNotValidDataSeries
      .pipe(
        filter(value => !!value),
        withLatestFrom(concatSelector),
        map(([value, {listaMassiva, parametroSelezionato}]) => ({value, listaMassiva, parametroSelezionato})),
        takeUntil(this._takeUntil$),
      )
      .subscribe(({value: val, listaMassiva, parametroSelezionato}) => {
        this.updateTheme();
        console.info('Valore dati non validi', val);

        const {name} = val!;
        let {parameter} = parametroSelezionato!;
        // Le serie del grafico principale
        let series = this.graphicOptions.getSeries();
        // let seriesOver = this.graphicOptions.getSeriesOver();
        let listaDataset = this.dataService.getDataset();

        // Ricerca dell'indice all'interno della lista options.series
        let index = this._searchIndexToList(series, name);
        // Ricerca dell'indice all'interno della lista nel service
        let indexDataset = this._searchIndexToList(listaDataset, name);

        this._updateVisibilityOfInvalidData(listaDataset, indexDataset, parameter);

        let {min, max, dataIndex} = this._getMaxMinDataIndex(listaDataset, indexDataset, parameter);
        // Data della serie principale del grafico
        let {data: dataSeries, dataAfterRelativa} = this.getSeriesData(series, index);

        // verifico se sono presenti dei dati da salvare e non ho una lista massiva
        if (this.dataService.getIsSaved() && !listaMassiva?.length) {
          // nel caso che ci siano dati da salvare devo sostituire il dataindex con un altro array che contenga i valori modificati
          dataIndex = this.dataService.getArrayObservableData();
        }
        // Nel caso che ci sia una modifica massiva devo passare i valori modificati
        if (listaMassiva?.length) {
          // Nel caso che il massivo sia diverso da quello che ho nel service allora devo passare i valori modificati
          if (listaMassiva.length !== dataIndex.length) {
            //   cerco il primo index della lista massiva su dataIndex
            let firstIndex = dataIndex.findIndex(({timestamp}) => timestamp === listaMassiva[0].timestamp);
            // Sostituisco i valori
            dataIndex = dataIndex.slice(0, firstIndex)
              .concat(listaMassiva)
              .concat(dataIndex.slice(firstIndex + listaMassiva.length));
          } else {
            dataIndex = listaMassiva;
          }
        }
        // let dataSeriesOver = seriesOver[ indexOverview ].data as Partial<IGeneratePoint>[] ?? [];
        this._processData({dataIndex, parametro: parameter, dataSeries, min, max, decimal: parameter.parametro.decimalDigits});
        if (dataAfterRelativa?.length && this.scaleType === 'relativa') {
          this._processData({dataIndex, parametro: parameter, dataSeries: dataAfterRelativa, min, max, after: true, decimal: parameter.parametro.decimalDigits});
          // series[index].dataAfterRelativa = dataAfterRelativa;
        }

        series[index].data = dataSeries;
        this.graphicOptions.setSeries(series);

        this.echartsOptions = {...this.graphicOptions.option};
        // this.setMinMaxDataZoom( { start: undefined , end: undefined } );
      });
  }

  /**
   * Retrieves the data series from the specified index of the given series array.
   *
   * @param {Partial<ICreateItemData<any>>[]} series - The series array from which to retrieve the data.
   * @param {number} index - The index of the series array from which to retrieve the data series.
   * @return {data:Partial<IGeneratePoint>[], dataAfterRelativa?: Partial<IGeneratePoint>[]} - The data series retrieved from the specified index of the series array.
   */
  private getSeriesData(series: Partial<ICreateItemData<any>>[], index: number): { data: Partial<IGeneratePoint>[], dataAfterRelativa: Partial<IGeneratePoint>[] } {
    let {data, dataAfterRelativa} = series[index] as { data: Partial<IGeneratePoint>[], dataAfterRelativa: Partial<IGeneratePoint>[] };
    return {
      data,
      dataAfterRelativa
    }
  }

  /**
   * Process the given data by filtering and modifying it.
   * @param {IProcessData} argomento - Prendiamo il {dataIndex,parametro: {visibleNotValid},dataSeries, min, max, after = false
   * @return void
   */
  private _processData({dataIndex, parametro: {visibleNotValid}, dataSeries, min, max, after = false, decimal}: IProcessData): void {
    dataIndex.forEach(({validity_flag, timestamp, valore_validato, ...item}, i) => {
        let utuTime = timestamp + (60 * 60 * 1000);
        // let { value: valueOver } = dataSeriesOver[ i ];
        if (+validity_flag < 0 && item.verification_flag !== 3) {
          if (!visibleNotValid) {
            console.info('nascondo');
            dataSeries[i].value = [utuTime, ''];
            // valueOver = [ timestamp , '' ];
          } else {
            console.info('mostro');
            // dataSeries[i].value = this.scaleType == 'relativa' && !!valore_validato ? [timestamp, (((valore_validato - min) * 100) / (max - min))] : [timestamp, valore_validato];
            dataSeries[i].value = this.scaleType == 'relativa' && !!valore_validato && !after ? [utuTime, this.graphicOptions.getRelativeValue(valore_validato, {
              min,
              max
            })] : [utuTime, valore_validato?.toFixed(decimal)];
            // valueOver = [ timestamp , valore_validato ];
          }
        } else {
          // dataSeries[i].value = this.scaleType == 'relativa' && !!valore_validato ? [timestamp, (((valore_validato - min) * 100) / (max - min))] : [timestamp, valore_validato];
          dataSeries[i].value = this.scaleType == 'relativa' && !!valore_validato && !after ? [utuTime, this.graphicOptions.getRelativeValue(valore_validato, {
            min,
            max
          })] : [utuTime, valore_validato?.toFixed(decimal)];
        }
      }
    );
  }

  /**
   * Calculates the minimum and maximum values and corresponding indices
   * of a dataset for a given index and visibility settings.
   *
   * @param {Array<IGrafico>} listaDataset - The dataset list.
   * @param {number} indexDataset - The index of the dataset to analyze.
   * @param {Object} param - The parameter object.
   * @param {boolean} param.visibleNotValid - Determines whether to include
   *   invalid values in the calculation.
   *
   * @returns {Object} - An object containing the minimum value, maximum value,
   *   and the dataset used for the calculation.
   */
  private _getMaxMinDataIndex(listaDataset: Array<IGrafico>, indexDataset: number, {visibleNotValid}: IParameter): { min: number; max: number; dataIndex: Array<Dataset> } {
    let min: number;
    let max: number;
    // Dataset del grafico selezionato
    let dataIndex = listaDataset[indexDataset].dataset ?? [];
    if (!visibleNotValid) {
      let listaValoriValidi = dataIndex.filter(({validity_flag}) => validity_flag > 0).map(({valore_validato}) => valore_validato) as ReadonlyArray<number>;
      // nascondo
      min = Math.min(...listaValoriValidi);
      max = Math.max(...listaValoriValidi);
    } else {
      let listaValori = dataIndex?.map(({valore_validato}) => valore_validato);
      min = Math.min(...listaValori);
      max = Math.max(...listaValori);
    }
    return {min, max, dataIndex};
  }

  /**
   * Update the visibility of invalid data for a specific dataset in the given list.
   * Manda il valore modificato al service
   * @param listaDataset - The list of datasets.
   * @param indexDataset - The index of the dataset to update.
   * @param visibilityNotValid - The visibility value for invalid data.
   * @param visibileParameter - La visibilità del parametro selezionato
   * @returns A new list of datasets with the visibility of invalid data updated for the specified dataset.
   */
  private _updateVisibilityOfInvalidData(listaDataset: Array<IGrafico>, indexDataset: number, {visibleNotValid: visibileParameter}: IParameter): void {
    // Itero la lista e setto il valore di visibilità dei dati non validi per la serie
    listaDataset = listaDataset.map((data, i) => {
      if (i === indexDataset) {
        return {...data, visibleNotValid: visibileParameter};
      }
      return data;
    })
    this.dataService.setDataset(listaDataset);

  }

  /**
   * Handles the change in color series.
   *
   * This method is responsible for updating the color series in the chart and the dataset
   * when a new color is selected for a specific name.
   *
   * @returns {void}
   */
  private _handleColorSeriesChange(): void {
    this.changeColorSeries
      .pipe(
        filter(value => !!value.name),
        takeUntil(this._takeUntil$),
      )
      .subscribe((val) => {
        this.updateTheme();
        let listaDataset = this.dataService.getDataset();

        let index = this.graphicOptions.findIndexToName(val.name);
        this.graphicOptions.setColorSeries(index, val.color);

        // let indexDataset = listaDataset.findIndex(({name}) => name == val.name);
        // listaDataset[indexDataset].color = val.color;
        listaDataset = listaDataset.map((data) => data.name === val.name ? {...data, color: val.color} : data);
        this.dataService.setDataset(listaDataset);
        let {start, end} = this.graphicOptions.getInstanceZoomData();
        this.setMinMaxDataZoom({end, start});
        this.echartsOptionsOverView = {...this.graphicOptions.returnOption({overView: true})};
      });
  }

  /**
   * Handles the value change event.
   * @return {void}
   */
  private _handleValueChange(): void {
    this.changeValueInput
      .pipe(
        filter(value => !!value),
        withLatestFrom(this.storeService.select(parametroSelector).pipe(filter(value => !!value))),
        map(([value, parametro]) => ({val: value, parametro})),
        takeUntil(this._takeUntil$),
      )
      .subscribe(({val, parametro}) => {

        let {visibleNotValid} = parametro?.parameter ?? {visibleNotValid: false};

        let parameter: Partial<IParameter> = val.input.parameter ?? {};
        let seriesName = UtilityClass.getAParameterAndStationName(parameter);

        /**
         * @description Funzione che verifica se il valore è un array o un oggetto
         */
        function isArrayOrObject(value: any): boolean {
          if (Array.isArray(value)) {
            return value[0] === val.indice
          }
          if (typeof value === 'object' && 'value' in value) {
            return value.value[0] === val.indice + (60 * 60 * 1000)
          }
          return false;
        }

        // La funzione restituisce l'index della seria con il nome del parametro che abbiamo selezionato
        const mapFindIndex = (serie: ReadonlyArray<Partial<ICreateItemData<any>>>) => {
          return serie.map(({name}) => name).findIndex((name) => name === seriesName);
        }

        /**
         * @description Funzione che mappa l'array o l'oggetto per farlo uscire come valore
         */
        function mapArray(value: any) {
          if (typeof value === 'object' && 'value' in value) {
            return value.value
          }
          return value;
        }

        if (val) {
          let series = this.graphicOptions.getSeries();
          let indexParametro = this._getUltimateParametroSeleziona(parametro!.parameter!);
          // indice del punto modificato
          let indexTime = this.graphicOptions.getSerie(indexParametro).data?.findIndex(isArrayOrObject);
          // Indice del parametro selezionato nelle serie
          let index = mapFindIndex(series);
          // Key del parametro che abbiamo modificato
          let key = parameter?.parametro?.key ?? '';
          let {value} = val;

          this.dataService.addSaveValue(key, value);


          let numbers = series[index].data!.map(mapArray).map(([value]: [number, number]) => value);
          let min = Math.min(...numbers);
          let max = Math.max(...numbers);

          series[index].data![indexTime!] = this.graphicOptions.generatePoint(val.value, {
            min,
            max,
            isOrigin: false,
            notValidDataVisible: visibleNotValid,
            visualizza: visibleNotValid,
            decimal: parameter.parametro?.decimalDigits
          });
          this.echartsOptionsOverView.series[this.indiceSelezionato].data[indexTime!] = this.graphicOptions.generatePoint(val.value, {
            min: 1,
            max: 1,
            isOrigin: false,
            visualizza: visibleNotValid
          });

          (series[index].data![indexTime!] as Partial<IGeneratePoint>).point_dataset.valore_validato = val.value.valore_validato;

          this.echartsOptionsOverView.series[this.indiceSelezionato].data[indexTime!].point_dataset.valore_validato = val.value.valore_validato;

          // ricerco il grafico nella lista dei grafici
          // indice del grafico selezionato tramite nome
          let indexGrafico = this.valoriInputGrafico.findIndex(({name}) => name === seriesName);
          // aggiorno il valore del dataset
          let newValore = {
            ...this.valoriInputGrafico[indexGrafico],
            dataset: series[index].data?.map(item => (item as Partial<IGeneratePoint>).point_dataset)!
          };
          this.valoriInputGrafico = [...this.valoriInputGrafico.slice(0, indexGrafico), newValore, ...this.valoriInputGrafico.slice(indexGrafico + 1)];

          this.graphicOptions.setSeries(series);
          this.graphicOptions.setRender(this.selectedRenderGraph, this.indiceSelezionato);
          // this.setMinMaxDataZoom();
          // in questo caso devo eliminare il valore start e end del dataZoom
          // this.graphicOptions.setZoomDataOpt( { start: undefined , end: undefined } );
          // this.echartsOptions = this.graphicOptions.returnOption();
          this.graphicOptions.instance.setOption({...this.graphicOptions.option});
          this.echartsOptions = {...this.graphicOptions.option};
          this.echartsOptionsOverView = {...this.echartsOptionsOverView};
        }
      });
  }

  /**
   * Handles the selected parameter event.
   *
   * @returns {void}
   */
  private _handleSelectedParameter(): void {
    this.dataService.resetParametroSelezionato$
      .pipe(
        filter(value => value),
      )
      .subscribe({
        next: value => this.parametroSelezionato = ''
      })

    this.dataService.selectedParameter$
      .pipe(
        filter(value => !!value && !!Object.keys(value).length),
        withLatestFrom(this.storeService.select(limitiValidazioneSelector)),
        map(([{parameter, index}, limiti]) => ({parameter, index, limite: limiti.find(item => item.id_parametro === parameter!.parametro.key.split('.')[3])})),
        takeUntil(this._takeUntil$),
      )
      .subscribe(({parameter, index: indexParameter, limite}) => {
        // parte lo spinner
        this._showSpinner();
        this._createMark([]);
        if (this.limitToggle && limite) {
          this._createMarkLimit(limite, parameter);
        }

        this.periodoDays = this.graphicOptions.getDays();
        let {startValue: start, endValue: end} = this.graphicOptions.getInstanceZoomData();
        if (start && end && this.periodSelected !== 'full') {
          this.graphicOptions.setZoomDataOpt({startValue: start + (60 * 60 * 1000), endValue: end + (60 * 60 * 1000), start: undefined, end: undefined});
        } else {
          this.graphicOptions.setZoomData(0, 100);
          this.graphicOptions.instance.setOption({...this.graphicOptions.option});
        }

        let notSelectParameter = this.parametroSelezionato !== this._getParametroSelezionato(parameter!);
        if (parameter && parameter.visible && notSelectParameter) {
          this.parametroSelezionato = this._getParametroSelezionato(parameter);
          this.indiceSelezionato = indexParameter!; //this.echartsOptions.series.map((x :any)=>x.name).findIndex((x:any)=>x==this.parametroSelezionato)
          let aggiornaIndice = this.graphicOptions.findIndexToName(this.parametroSelezionato);
          //this._createGraficoAfterItemSelect( aggiornaIndice , parameter );
          let graficoItemSelezionato = this.valoriInputGrafico.find(item => this._getParametroSelezionato(item) === this.parametroSelezionato);
          // nel caso che non trovassi il grafico lancio un errore
          if (!graficoItemSelezionato) {
            throw new Error('Grafico non trovato');
          }
          let datasetOutputDettaglio: Dataset[] = [];

          let {startValue: start, endValue: end} = this.graphicOptions.getInstanceZoomData();
          if (start && end) {
            datasetOutputDettaglio = graficoItemSelezionato.dataset.filter((data) => data.timestamp >= start! && data.timestamp <= end!);
          } else {
            let {indexStart, indexEnd} = this._startAndEndIndex(graficoItemSelezionato.dataset.length);
            let {timestamp: startValue} = graficoItemSelezionato.dataset[indexStart];
            let {timestamp: endValue} = graficoItemSelezionato.dataset[indexEnd];
            datasetOutputDettaglio = graficoItemSelezionato.dataset.filter((data) => data.timestamp >= startValue && data.timestamp <= endValue);
          }

          let output: IOutput = {
            dataset: datasetOutputDettaglio,
            index: this.indiceSelezionato,
            parameter: parameter,
          };

          this.dataService.setParametersList(output);
          this.storeService.dispatch(setInputChangedDettaglioAction(output));
          // Cambio anche il valore del valoreGrafico
          this.valoriInputGrafico = this.valoriInputGrafico.map((grafico) => grafico.key === parameter.measurementId ? {...grafico, ...parameter} : grafico);

          let series = this.graphicOptions.resetShowAll();

          //this.graphicOptions.setSymbolSizeWithValue( length );

          series[aggiornaIndice].lineStyle = {
            ...series[aggiornaIndice].lineStyle,
            type: parameter.parametro.key.includes('|') ? 'dashed' : 'line',
            // width: parameter.parametro.key.includes('|') ? 4 : 1.5,
            width: 1.5,
          };
          // elimino item dalla lista e poi lo inserisco in prima posizione
          series = this.graphicOptions.removeAndMoveSeriesToIndex(aggiornaIndice, series);
          // nel caso che ci siano dei punti che sono stati selezionati e non cancellati
          this.graphicOptions.removeBorder(series);

          this.graphicOptions.setSeries(series);
          this.graphicOptions.setRender(this.selectedRenderGraph, aggiornaIndice);
          this.echartsOptionsOverView = {
            ...this.echartsOptionsOverView,
            series: this.graphicOptions.setZSerie(indexParameter!, this.echartsOptionsOverView.series, {start: start + (60 * 60 * 1000), end: end + (60 * 60 * 1000)})
          };
          this.echartsOptions = {...this.graphicOptions.option};
        } else if (!parameter?.visible) {
          let parametersList = this.dataService.getParametersList();
          // se non è visibile il parametro selezionato non ho ancora nulla in tabella
          if (parametersList) {
            this.parametroSelezionato = '';
            let output: IOutput = {
              dataset: [],
              index: indexParameter!,
              parameter: parameter ?? {},
            };

            this.dataService.setParametersList(output);
          }

        }

        // Modifico il parametro massivo
        this.massivo = false;

        // chiudo lo spinner
        this._hideSpinner();
      });
  }

  /**
   * Listens for changes in the periodFormControl value and performs necessary actions.
   *
   * @returns {void}
   */
  private _listenChangePeriodValue(): void {
    this.periodFormControl.valueChanges
      .pipe(
        startWith('full'),
        pairwise(),
        map<[old: PeriodType, next: PeriodType], { old: PeriodType, next: PeriodType }>(([old, next]) => ({old, next})),
      )
      .subscribe(({next, old}) => this._setPeriodAndHandleChange(next, old));
  }

  private _setPeriodAndHandleChange(next: PeriodType, old: PeriodType) {
    this._handlePeriod(next, old);
    if (next !== 'succ' && next !== 'prec') {
      this.periodSelected = next;
    }
    this.setPeriod(next);
  }

  private _handlePeriod(next: PeriodType, old: PeriodType) {
    if (!this._hasSuccessOfSetPeriod(next)) {
      // this._hideSpinner();
      this.periodFormControl.setValue(old, {emitEvent: false});
      throw new Error('Non è stato possibile impostare il periodo');
    }
  }

  /**
   * Listens for changes in the scale value of the graphics.
   *
   * @private
   *
   * @returns {void}
   */
  private _listenChangeScaleGrafico(): void {
    this.scalaFormControl.valueChanges
      .pipe(
        startWith('assoluta'),
        pairwise(),
        map(([old, next]) => ({old, next})),
      )
      .subscribe(({next, old}) => this.setScale(next, {oldScale: old}))
  }

  ngOnInit() {
    this.updateTheme();
    moment.tz.setDefault('Europe/Berlin');
    moment.locale('it');
    moment.updateLocale('it', null);
    this.translationOption();
    this._listenChangeValueDettaglioStore();

    this._listenClickOnPoint();
    this._listenChangeDataZoomWithParametroSelezionato();
    this._listenDeleteParametro();
    this._listenVisibleValue();
    this._listenChangeMassive();

    this._handleSelectedParameter();
    this._handleValueChange();
    this._handleColorSeriesChange();
    this._handleInvalidDataSeriesVisibility();
    this._handleVisibilityChange();
    this._handleDataSetInput();
    this._handleTaraturaData();
    this._listenChangePeriodValue();
    this._listenChangeScaleGrafico();
  }

  /**
   * @description Sottoscrizione colore tema e modifica colore del testo dei grafici
   */
  updateTheme() {
    this.themeColorService.currentColor$
      .pipe(
        filter(value => !!value),
      )
      .subscribe((value) => this.themeColorMode = value);
  }

  /**
   * @description Set the scale of a graph based on the given event.
   *
   * @param {string} event - The event type for setting the scale.
   * @param {number} [fondoScala] - The fondoScala value for 'manuale' and 'impostaManuale' events.
   * @param {number} [minFondoScala] - The minFondoScala value for 'impostaManuale' event.
   * @param {ScaleEnum} oldScale - The old scale value.
   */
  setScale(event: ScaleEnum, {fondoScala, minFondoScala, oldScale}: TypeScale): void {
    let sub = new Subject<void>();
    // Chiamo lo store per avere i punti se ci sono
    this.storeService.select(selectPointsSelector)
      .pipe(
        withLatestFrom(this._replaySubject$),
        takeUntil(sub)
      )
      .subscribe(([points, oldPoints]) => {
          sub.next();
          this._replaySubject$.next(points);
          console.info('Evento scala', event);
          console.info('Vecchi punti', oldPoints);
          console.info('Punti', points);
          this.scaleType = event
          let yAxis = this.graphicOptions.getYAxis();
          this.graphicOptions.restoreData();
          switch (event) {
            case ScaleEnum.assoluta:
              this.showInputFondoscala = false;
              yAxis = {
                ...yAxis,
                min: undefined,
                max: undefined,
              };
              // if (!this.graphicOptions.hasBorderWidthInFirstSeries()) {
              //   points.map(({index}) => this.graphicOptions.setBorderWidth(index!));
              // } else {
              //   // Elimino i punti vecchi
              //   oldPoints.map(({index}) => this.graphicOptions.setBorderWidth(index!));
              //   // Aggiungo i punti nuovi
              //   points.map(({index}) => this.graphicOptions.setBorderWidth(index!));
              // }
              break;
            case ScaleEnum.manuale:
              this.openMinMaxDialog(oldScale, yAxis);
              break;
            case ScaleEnum.impostaManuale:
              yAxis = {
                ...yAxis,
                min: minFondoScala,
                max: fondoScala,
              };
              break;
            case ScaleEnum.relativa:
              this.showInputFondoscala = false;
              yAxis = {
                ...yAxis,
                min: "0",
                max: "100",
              }
              this.graphicOptions.getAllMinMaxYAxis();
              // points.map(({index}) => this.graphicOptions.setBorderWidth(index!));
              break;
            default:
              yAxis = this.graphicOptions.getYAxis();
          }
          this.graphicOptions.setYAxis(yAxis);
          this.graphicOptions.instance.setOption({...this.graphicOptions.option});
          this.storeService.dispatch(setScaleGraficoAction({scale: event}));
        }
      )


  }

  /**
   * @description Opens the MinMax dialog for selecting parameters.
   *
   * @return {void}
   */
  openMinMaxDialog(oldScale: ScaleEnum, yAxis: Partial<IYAxis>): void {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      id: 1,
      title: 'Selezione parametri',
    };

    const dialogRef: MatDialogRef<DialogMaxMinComponent, { max: string, min: string }> = this.dialog.open(DialogMaxMinComponent, dialogConfig);

    dialogRef
      .afterClosed()
      .pipe(
      )
      .subscribe((date) => {
        if (!date) {
          this.scalaFormControl.setValue(oldScale)
        } else {
          this.showInputFondoscala = true;
          yAxis = {
            ...yAxis,
            min: undefined,
            max: undefined,
          };
          const {min, max} = date ?? {max: '', min: ''};
          if (!max || !min) {
            // Setto il valore precedente
            this.scalaFormControl.setValue(oldScale, {emitEvent: false});
            this.storeService.dispatch(setScaleGraficoAction({scale: oldScale}));
            return;
          }
          this.setScale(ScaleEnum.impostaManuale, {fondoScala: max, minFondoScala: min, oldScale});
        }

      });
  }

  /**
   * @description Cambio il valore del periodSelected quando clicco prec o succ
   * @param {PeriodType} arg - Prende solo le succ e prec
   * @void
   */
  setForm(arg: PeriodType) {
    let value = this.periodFormControl.value;
    this.storeService.select(changesMassiveSelector).pipe(take(1)).subscribe((data) => {
      this.massivo = data.length > 0
      this._setPeriodAndHandleChange(arg, value);
    })
  }

  /**
   * @description metodo che viene chiamato per la selezione del periodo
   *
   * 1. 1 - giorno
   * 2. 3 - giorni
   * 3. 7 - giorni
   * 4. 30 - giorni
   * 5. full - giorni
   * 6. personalized
   *
   * @param  event {PeriodType}  1 - 3 - 7 - full - personalized - succ - prec
   */
  setPeriod(event: PeriodType) {
    let sub = new Subject<void>();
    this.storeService.select(selectorPointsSelector)
      .pipe(
        takeUntil(sub),
      )
      .subscribe(({points, cambioMassivo}) => {

        sub.next();

        points.map(({index}) => this.graphicOptions.setBorderWidth(index!));

        if (event === 'personalized') {
          let sub = new Subject<void>();
          this.dialogService.openDialogSetPeriodoPersonalizzato()
            .pipe(
              filter(({start, end}) => !!start && !!end),
              distinctUntilChanged((prev, curr) => prev.start === curr.start && prev.end === curr.end),
              debounceTime(500),
              takeUntil(sub),
            )
            .subscribe({
              next: ({end, start}) => {
                // console.info('Data', {start, end});
                sub.next();
                sub.complete();
                let daysToData = this.graphicOptions.getDaysToData(start, end);
                let startDate = this.graphicOptions.createUTC(new Date(start).getTime());
                // let startDate = setMinutes(setHours(new Date(start), 0), 1).getTime();
                // let stopDate = daysToData < 1 ? this.graphicOptions.addDaysToTime(new Date(start).getTime(), '1') : this.graphicOptions.addDaysToTime(new Date(start).getTime(),daysToData.toString() as PeriodType);
                let stopDate = this.graphicOptions.createUTC(new Date(end).getTime(), 24 * 60);
                // this.arrayDateComplete = this._getArrayDateComplete(startDate, stopDate, event);
                let indiceGrafico = this.valoriInputGrafico.findIndex((({name}) => name == this.parametroSelezionato));
                let timeList = this.valoriInputGrafico[indiceGrafico].dataset.filter((data) => data.timestamp >= startDate - (60 * 60 * 1000) && data.timestamp <= stopDate - (60 * 60 * 1000));
                if (!timeList.length) {
                  throw new Error(this.translateService.instant('snackbar.no_data_show.message'));
                }
                let output: IOutput = {
                  dataset: timeList,
                  index: indiceGrafico,
                  parameter: this.valoriInputGrafico[indiceGrafico],
                };
                this.dataService.setParametersList(output);
                // Segnalo il valore nello store in modo che possa usarlo
                this.storeService.dispatch(setInputChangedDettaglioAction(output));

                this.graphicOptions.setZoomDataOpt({
                  startValue: startDate,
                  endValue: stopDate,
                  start: undefined,
                  end: undefined,
                });
                // this.startDatePersonalized = startDate;
                // this.endDatePersonalized = stopDate;
                this.days = daysToData;
                let option = this.graphicOptions.option;
                this.graphicOptions.instance.setOption({...option});
                this.echartsOptions = {...option};

                // let datasetOutputDettaglio: Array<Dataset> = [];
                // this._createInputDataTable(datasetOutputDettaglio, option);
                this._setMarkAreaOver(event, startDate, stopDate, startDate, stopDate);
              }
            })
        } else if (this.graphicOptions.instance) {


          //this._showSpinner();

          let listaAction: 'succ' | 'prec' | undefined = undefined;
          // Calcolo il periodo in giorni tra il primo giorno e l'ultimo del grafico
          this.periodoDays = this.graphicOptions.getDays();


          // Indice del parametro selezionato
          this.indiceSelezionato = this.graphicOptions.findIndexToName(this.parametroSelezionato);

          let {startValue: istartValue, endValue: iendValue, end, start} = this.graphicOptions.getInstanceZoomData();

          // Calcolo la differenza tra le due date
          let calendarDays = differenceInCalendarDays(iendValue, istartValue);
          let indiceGrafico = this.valoriInputGrafico.findIndex((({name}) => name == this.parametroSelezionato));

          let dataset = this.valoriInputGrafico[indiceGrafico].dataset;
          let max = Math.max(...dataset.map(item => item.timestamp)) + (60 * 60 * 1000);
          let min = Math.min(...dataset.map(item => item.timestamp));
          if (event === 'prec' || event === 'succ') {
            listaAction = event;
            // Aggiorno inizio data
            istartValue = this.graphicOptions.addDaysToTime(istartValue, event, calendarDays);
            // prendo il min e massimo valore del dataset
            if (istartValue < min) {
              istartValue = min;
            }
            // verifico se lo start è maggiore del massimo
            if (istartValue >= max) {
              istartValue = (max + (60 * 1000)) - (calendarDays * (24 * 60 * 60 * 1000));
            }
            // Nel caso che fosse 100 allora cambio il valore della varibile end
            end = end === 100 ? 0 : end;
            // Trasformo l'evento movimento ad un periodo
            event = calendarDays.toString() as PeriodType;
          }
          // Inizio le date in zero
          let utc = 0;
          let utcFine = 0;
          // Nel caso che fossi alla fine del periodo
          if (start && start !== 0 && end && end === 100 && (event === '1' || event === '3' || event === '7')) {
            // Se sono alla fine posso considerare se event e minore della differenza tra le date
            let evntoMinToCalendarDays = calendarDays >= +event;
            // Utc diventa il utcFine - il periodo selezionato
            utc = evntoMinToCalendarDays ? istartValue + (60 * 60 * 1000) : (iendValue + (120 * 60 * 1000)) - (+event * (24 * 60 * 60 * 1000));
            utcFine = evntoMinToCalendarDays ? this.graphicOptions.addDaysToTime(istartValue, event) : iendValue + (60 * 60 * 1000);
          } else {
            utc = this.graphicOptions.createUTC(istartValue);
            utcFine = this.graphicOptions.addDaysToTime(istartValue, event);
            if (utcFine > max) {
              utc = this.graphicOptions.createUTC(max - (+event * (24 * 60 * 60 * 1000)));
              utcFine = max;
            }
          }


          // utcFine = this.graphicOptions.createUTC(utcFine);

          let timeList = event === 'full' ? this.valoriInputGrafico[indiceGrafico].dataset : this.valoriInputGrafico[indiceGrafico].dataset.filter((data) => data.timestamp >= utc - (60 * 60 * 1000) && data.timestamp <= utcFine - (60 * 60 * 1000));
          if (!timeList.length) {
            //this._hideSpinner();
            this.dialogService.openInfoDialog(this.translateService.instant('snackbar.change_period.title'), this.translateService.instant('snackbar.change_period.message')).subscribe(data => {
            })
            throw new Error('Non ci sono dati nel periodo selezionato');
          }
          let output: IOutput = {
            dataset: timeList,
            index: indiceGrafico,
            parameter: this.valoriInputGrafico[indiceGrafico],
          };
          this.dataService.setParametersList(output);
          // Segnalo il valore nello store in modo che possa usarlo
          this.storeService.dispatch(setInputChangedDettaglioAction(output));

          this.graphicOptions.setZoomDataOpt({
            startValue: utc,
            endValue: utcFine,
            start: event === 'full' ? 0 : undefined,
            end: event === 'full' ? 100 : undefined,
          });
          let option = this.graphicOptions.option;
          this.graphicOptions.instance.setOption({...option});
          this.echartsOptions = {...option};
          this._setMarkAreaOver(event, utc, utcFine, utc, utcFine);

        }
      });

  }

  /**
   * @description Function called when a chart is initialized in HTML.
   *
   * @param {any} event - The event object associated with the chart initialization.
   * @param {string} type - The type of chart being initialized.
   *
   * @return {void}
   */
  onChartInitHtml(event: any, type: string): void {
    // console.info('chart event:', type, event);
    this.onChartInit(event);
  }

  /**
   * @description Initializes the chart.
   *
   * @param {ECharts} ec - The instance of ECharts.
   */
  onChartInit(ec: ECharts) {

    this.graphicOptions.setInstance(ec);

    this.graphicOptions.instance.on('click', (e: any & { data: Partial<IGeneratePoint> }) => {
      if (this.scaleType !== 'relativa') {
        this.storeService.dispatch(clickOnPoint(e?.data, e?.dataIndex, e?.seriesIndex));
      }
    });

    this.graphicOptions.instance.on('datazoom', (e: any & {
      batch?: Array<{ startValue: number, endValue: number }>
    }) => {
      console.clear();
      console.info('Datazoom', e);
      // let {startValue, endValue} = this.graphicOptions.getInstanceZoomData();
      this.storeService.dispatch(dataZoomAction({start: e?.start, end: e?.end, batch: e?.batch}));

      let {lunghezza, indexStart, indexEnd, indiceGrafico} = this._extractedIndexStartEnd(e);
      let {
        timestamp,
        timestampEnd
      } = e?.batch?.length ? this._startAndEndTimeToEcharts(e) : this._startAndEndTime(indexStart, indexEnd, lunghezza, indiceGrafico);
      let newVar = [{xAxis: timestamp}, {xAxis: timestampEnd}];
      let dataDaSalvare = this.dataService.getToSaveValue().size;
      let {startValue, endValue} = this.graphicOptions.getInstanceZoomData();
      this.startDatePersonalized = startValue;
      this.endDatePersonalized = endValue;

      if (this.parametroSelezionato && (dataDaSalvare || this.massivo)) {
        this.dialog.open(DialogInfoComponent, {
          data: {
            title: this.translateService.instant('dialog_not_remove.title'),
            message: this.translateService.instant('dialog_not_remove.body'),
          }
        }).afterClosed().subscribe(() => {
          this.graphicOptions.instance.setOption({...this.graphicOptions.option});
          this.echartsOptions = {...this.graphicOptions.option};
        });
        throw new Error('Non possiamo muovere Datazoom perchè ' + dataDaSalvare + ' sono in salvataggio');
      }

      if (this.parametroSelezionato && !dataDaSalvare) {
        this.periodSelected = 'personalized';

        this._selectValuesToTable();

        this._resetMarkAreaSeries();

        let {indexStart: start, indexEnd: end} = this._extractedIndexStartEnd(e);
        let newVar = [{xAxis: startValue + (60 * 60 * 1000)}, {xAxis: endValue + (60 * 60 * 1000)}];

        this.echartsOptionsOverView.series[0].markArea.data = [newVar];
        this.echartsOptionsOverView = {...this.echartsOptionsOverView};

        if (e?.batch?.length) {
          this.graphicOptions.setZoomDataOpt({
            start: undefined,
            end: undefined,
            startValue: start,
            endValue: end,
          });
          // TODO adesso nel caso che abbia un parametro selezionato perdo lo zoom
          this.graphicOptions.instance.setOption({dataZoom: this.graphicOptions.getZoomData()});
        } else {
          this.setMinMaxDataZoom();
        }
      }

      if (this.indiceSelezionato < 0 && this.periodSelected === 'personalized') {

        this.echartsOptionsOverView.series.map((element: any, i: number, list: Array<any>) => {
          list[i].markArea.data = [];
        });
        this.echartsOptionsOverView.series[0].markArea.data = [newVar];
        this.echartsOptionsOverView = {...this.echartsOptionsOverView};
      }

      this.dataService.setTaratura([])

      // prendiamo la data dalla instance di echarts

      // this.graphicOptions.setZoomData( startValue, endValue );
      // this.echartsOptions = { ...this.graphicOptions.option };
    }, 'primo');
  }

  /**
   * @description Sets the minimum and maximum data zoom values.
   *
   * @param {Object} value - The object containing the start and end values for data zoom.
   * @param {number} [value.start] - The minimum data zoom value.
   * @param {number} [value.end] - The maximum data zoom value.
   *
   * @return {void}
   */
  setMinMaxDataZoom(value?: { start?: number; end?: number; }): void {
    this.graphicOptions.setZoomData(!value ? this.start : value.start!, !value ? this.end : value.end!);
    this.echartsOptions = {...this.graphicOptions.option};
  }

  /**
   * @description Checks if the current period selection allows disabling the next or previous actions.
   *
   * @returns {boolean} True if the current period selection allows disabling the next or previous actions, false otherwise.
   */
  hasDisableNextOrPrev(): boolean {
    let personalized = this.periodSelected === 'personalized';
    let full = this.periodSelected === 'full';

    return personalized || full;
  }

  /**
   * @description Metodo che prende le descrizioni per la select di scelta visualizzazione dati dai file di traduzione
   */
  translationOption() {
    this.languageService.currentLanguage$
      .pipe(
        switchMap((language: string) => this.translateService.getTranslation(language)),
        takeUntil(this._takeUntil$),
      )
      .subscribe((res: ITranslate) => {
        this.choiceModeRender = res.input.select_choice_render;
      })
  }

  /**
   * @description Change the rendering of the graph by updating the graphic options and echarts options.
   *
   * @param {ChangeRenderParamsType} data - The data containing the parameters for rendering the graph.
   * @return {void}
   */
  changeRender(data: ChangeRenderParamsType): void {
    console.info('render parte del grafico ' + data)
    this.graphicOptions.setRender(data, this.indiceSelezionato);
    this.echartsOptions = {...this.graphicOptions.option};
  }

  /**
   * @description Clears the mark area of all the graphics.
   *
   * @return {void}
   */
  clearRender(): void {
    console.info('clear markArea di tutti i grafici');
    this.graphicOptions.clearRender();
    this.echartsOptions = {...this.graphicOptions.option};
  }

  ngOnDestroy(): void {
    console.info('Destroy Grafico');
    this.sub.forEach(item => item.unsubscribe());
    this._takeUntil$.next(true);
    this.dataService.setSelectedParameter({} as ObservableData);
    this.dataService.setParametersList({} as IOutput);
    this.pollingService.stopPolling.next(null);
  }


  changeLimit(evento: MatSlideToggleChange) {
    // Solo nel caso in qui sia selezionato un parametro
    if (this.parametroSelezionato) {
      switch (evento.checked) {
        case true:
          this.storeService.select(limitiValidazioneSelector).pipe(
            take(1),
            withLatestFrom(this.storeService.select(parametroSelector)),
            map(([limiti, parametro]) => ({
              limite: limiti.find(item => item.id_parametro === parametro!.parameter.parametro.key.split('.')[3]),
              parametro
            })),
            filter(({limite, parametro}) => !!limite && !!parametro)
          ).subscribe({
            next: ({limite, parametro}) => this._createMarkLimit(limite, parametro!.parameter)
          });
          break;
        case false:
          this._createMarkLimit()
          break;
      }
    }
  }
}
