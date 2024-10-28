/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Grafic_abstractModel} from './grafic_abstract.model';
import {Dataset, IGrafico, ITaratura} from '@models/grafico';
import {ICreateItemData, IDataZoom, IGeneratePoint, IItemStyle, IOptionGrafic, IYAxis, PeriodType, ScaleType} from './models';
import {EChartsType} from 'echarts';
import {addDays, differenceInCalendarDays, format, isValid, setHours, setMinutes, setSeconds} from 'date-fns';
import {ChangeRenderParamsType} from '@models/ITranslate.interface';
import {FormControl} from "@angular/forms";
import {IParameter} from "@models/dataService";
import {LocalService} from "@services/core/locale/local.service";
import {DateSettingService} from "@services/core/utility/date-setting.service";


export interface IOptGenerate {
  min?: number;
  max?: number;
  notValidDataVisible?: boolean;
  isOrigin?: boolean;
  visualizza?: boolean;
  decimal?: number;
}

export interface IPropsCreateSerie {
  item: IGrafico;
  color?: string;
  primoSep?: boolean;
  datiVisibili?: boolean;
  decimal?: number;
}

interface IPropsCalcoloPeriodo {
  dateUTC: number;
  giorno: number;
  periodo?: number;
  periodoToDay: number;
}

export class OptionGraficClass extends Grafic_abstractModel<any> {

  // colori del grafico
  readonly colorValoreNonValidato = '#f8c1c1';//fascia sfondo grafico
  static readonly colorBlue = '#03b1fc';//pallino blu
  private colorCeleste = '#03b1fc';
  private colorOver = '#8db1f8';
  static readonly colorBlueScuro = '#0070c0';//quadrato blu
  readonly colorGreen = '#40D61A';
  readonly colorOrange = '#F17F04';
  readonly colorYellow = '#F7E600';
  readonly colorYellowChiaro = '#fcf6bc';
  readonly coloreValoreFFF = '#9EA2B6';
  private _periodoFormControl!: FormControl;

  lunghezzaPeriodo = 360;


  private _grid = {
    left: '6%',
    right: '8%',
    bottom: '12%',
    top: '3%',
    containLabel: true,
  };

  private _tooltip = {
    type: 'line',
    trigger: 'item',
    valueFormatter: (value: number) => {
      return value < 1000 ? value : format(new Date(value), 'dd-MM-yyyy')
    },
    // formatter: (function (params: any) {
    //   let label = '';
    //   let date = params?.value && params?.value?.[0] ? new Date(params?.value[0]) : undefined;
    //
    //   const time = date ? formatDate(date, 'dd-MM HH:mm', 'it') : undefined;
    //   //t = date.getDate() + "/" + date.getMonth() + " " + date.getHours() + ":" + date.getMinutes();
    //
    //   label = time ? params.seriesName + "<br />" + time + ": <b>" + params?.value[1] + "</b>" : '';
    //   return label;
    // }),
    axisPointer: {
      "label": {
        "backgroundColor": "#000fff",
        "color": "#fff000"
      }
    },
  };
  private _legend = {
    show: false,
    selected: {}
  };
  private _xAxis = {
    type: 'time',
    boundaryGap: false,
  };
  private _yAxis: IYAxis = {
    type: 'value',
    axisLabel: {formatter: '{value} '},
  };
  private _toolbox = {
    show: true,
    feature: {
      dataZoom: {
        yAxisIndex: 'none',
        // icon.back con valore - in modo da non visualizzare l'icona sul grafico
        icon: {
          back: '-'
        },
        iconStyle: {
          borderColor: '#005CA9',
          borderWidth: 1
        },
        emphasis: {
          iconStyle: {
            borderColor: '#005CA9',
            borderWidth: 2.5
          }
        },
        brushStyle: {
          color: '#006cb3',
          opacity: 0.3,
          borderColor: '#006cb3',
          borderWidth: 1
        }
      },
    },
    iconStyle: {
      borderColor: '#005CA9',
      borderWidth: 1
    },
    emphasis: {
      iconStyle: {
        borderColor: '#005CA9',
        borderWidth: 2.5
      }
    }
  };
  private _firstDataZoom = {
    realtime: false,
    // filterMode: 'weakFilter',
    // type: 'inside',
    labelFormatter: (value: number, valueString: string) => {
      return !!value ? this.dateSettingService.generateNameToTimeStamp({timestamp: value, addHours: false}) : '';
    },
    start: 0,
    end: 100,
    zoomOnMouseWheel: false,
    moveOnMouseMove: true,
    moveOnMouseWheel: true, // move up and down with mouse wheel
  };
  private _secondDataZoom = {
    realtime: false,
    labelFormatter: (value: number, valueString: string) => {
      return !!value ? this.dateSettingService.generateNameToTimeStamp({timestamp: value, addHours: false}) : '';
    },
  };
  private _visualMap = {
    show: false,
    dimension: 0,
    pieces: [],
  };
  private _graphic = {
    type: 'line',
    progressive: true,
  };
  public option: IOptionGrafic = {
    legend: this._legend,
    tooltip: this._tooltip,
    grid: this._grid,
    useUTC: true,
    xAxis: this._xAxis,
    yAxis: this._yAxis,
    // legend: legend ,
    toolbox: this._toolbox,
    graphic: this._graphic,
    dataZoom: [
      this._firstDataZoom,
      this._secondDataZoom,
    ],
    visualMap: this._visualMap,
    series: [],
  };
  public optionOver: IOptionGrafic = {
    ...this.returnClone(this.option),
    dataZoom: []
  };
  public scaleType: ScaleType = 'assoluta';
  instance!: EChartsType;
  grafici: Array<IGrafico> = [];

  constructor(private readonly localService: LocalService, private readonly dateSettingService: DateSettingService,) {
    super();
  }


  /**
   * @description Ritorna le serie dell'oggetto instance di echarts o dell'oggetto option, nel caso in cui non sia stata settata l'istanza
   * @returns {Partial<ICreateItemData<any>>[]}
   * @example
   * let series = getSeries();
   */
  override getSeries(): Partial<ICreateItemData<any>>[] {
    if (this.instance) {
      return this.instance.getOption()['series'] as Partial<ICreateItemData<any>>[];
    }
    return this.returnOption().series;
  }

  /**
   * @description Ritorna le serie dell'oggetto optionOver
   */
  getSeriesOver(): Partial<ICreateItemData<any>>[] {
    return this.returnClone(this.optionOver.series);
  }

  override setSeries(series: Partial<ICreateItemData<any>>[]): void {
    this.option.series = series;
  }

  override getSerie(index: number): Partial<ICreateItemData<any>> {
    return this.getSeries()[index];
  }

  override setSerie(index: number, serie: Partial<ICreateItemData<any>>) {
    this.option.series[index] = this.returnClone(serie);
    if (this.instance) {
      this.instance.setOption({...this.option});
    }
  }

  /**
   * Sets the value of a series at a given index in the optionOver object.
   *
   * @param {number} index - The index of the series to be updated.
   * @param {any} serie - The new value for the series.
   * @return {void}
   */
  setSerieOver(index: number, serie: any): void {
    this.optionOver.series[index] = this.returnClone(serie);
  }

  override resetSeries(i: number) {
    this.option.series.forEach((serie: any, index: number) => {
      if (index !== i) {
        serie.markArea = {
          ...serie.markArea,
          data: [],
        }
      }
    });
  }

  /**
   * @description Resetto le option del grafico over
   * @param {IOptionGrafic} option
   */
  resetOptionOver(option: IOptionGrafic): void {
    this.optionOver = this.returnClone(option);
  }

  /**
   * @description Ritorna una copia dell'oggetto option
   * @param {{overView: boolean}} opt
   * @returns {IOptionGrafic}
   */
  returnOption(opt?: { overView?: boolean }): IOptionGrafic {
    return this.returnClone(opt?.overView ? this.optionOver : this.option);
  }

  /**
   * Creates a deep clone of the input object using JSON serialization and deserialization.
   *
   * @param {T} input - The object to be cloned.
   * @returns {T} - The cloned object.
   */
  returnClone<T>(input: T): T {
    return JSON.parse(JSON.stringify(input));
  }

  /**
   * Sets the graphical option.
   * @param {IOptionGrafic} option - The graphical option to be set.
   * @return {void}
   */
  setOption(option: IOptionGrafic): void {
    this.option = option;
  }

  /**
   * Creates the series for the given array of charts.
   *
   * @param {ReadonlyArray<IGrafico>} grafici - Array of charts to create series for.
   * @param {{parametro?: IParameter, index?: number}} arg - Optional arguments.
   * @return {void} - No return value.
   */
  createSeries(grafici: ReadonlyArray<IGrafico>, {parametro, index, decimal}: { parametro?: IParameter, index: number, decimal: number }): void {
    this.localService.getTimeStore().subscribe(data => {
      let serie = this.returnClone(grafici.map(grafico => this._createSerie<any>({
        item: grafico,
        color: grafico.color,
        primoSep: false,
        decimal: decimal === -1 ? grafico.parametro.decimalDigits : decimal,
        datiVisibili: grafico.visibleNotValid
      })));
      let serieOrigin = this.returnClone(grafici.map(grafico => this.createItemData(grafico)));
      // this.option.series = [...serie, ...serieOrigin];
      this.series = [...serie, ...serieOrigin];
      let names = this.series.map<{ name: string, visible: boolean }>((item, index) => ({name: item.name, visible: !item.name.endsWith('origin') ? grafici[index].visible : false}));
      let recordObj: Record<string, boolean> = {};
      names.forEach(({name, visible}) => recordObj[name] = visible);
      this.option.legend!.selected = {...recordObj};
      this.option.series = [...serie, ...serieOrigin];
      this.option.xAxis = {
        ...this._xAxis,
        // min: timeMin => timeMin.min - (59*60*1000),
        // max: time => time.max + (59*60*1000),
        min: +data.periodo?.dataInizioTime! + (60 * 60 * 1000),
        // max: value => +data.periodo?.dataFineTime! + (169*60*1000),
      }
      this.createSeriesOver(grafici, index);
      this.grafici = [...grafici];
    })

  }

  /**
   * Adds a series with a list of graphics to the chart.
   *
   * @param {ReadonlyArray<IGrafico>} grafici - The list of graphics.
   * @param {PeriodType} [action] - The action to perform (optional).
   * @returns {void}
   */
  addSerieWithListGrafic(grafici: ReadonlyArray<IGrafico>, action?: PeriodType): void {
    let points = grafici.map(({dataset}) => dataset.map((item) => this.generatePoint(item, {min: 1, max: 1, notValidDataVisible: true, isOrigin: false})));
    let originPoints = grafici.map(({dataset}) => dataset.map(({timestamp, valore_originale}) => ([timestamp, valore_originale] as [number, number])));
    let length = this.option.series.length;
    points.forEach((point, index) => {
      let name = grafici[index].name;
      let indexSerie = this.findIndexToName(name);
      let indexSerieOrigin = this.findIndexToName(name, {origin: true});
      let first = point[0].value![0];
      let findIndex = (this.getSerie(indexSerie).data as Partial<IGeneratePoint>[])?.findIndex(({value}) => value![0] === first);
      let findIndexOrigin = (this.getSerie(indexSerieOrigin).data as [number, number][])?.findIndex(([time, value]) => time === first);
      if (findIndex > -1) {
        this.option.series[indexSerie].data?.splice(findIndex--);
        this.optionOver.series[index].data?.splice(findIndex--);
      }
      if (findIndexOrigin > -1) {
        this.option.series[indexSerieOrigin].data?.splice(findIndexOrigin--);
      }
      if (action === 'prec') {
        (this.option.series[indexSerie].data as Partial<IGeneratePoint>[]).unshift(...point);
        (this.option.series[indexSerieOrigin].data as [number, number][]).unshift(...originPoints[index]);
        (this.optionOver.series[index].data as Partial<IGeneratePoint>[])?.unshift(...point);
      }
      if (action === 'succ') {
        // aggiungo elementi alla serie
        (this.option.series[indexSerie].data as Partial<IGeneratePoint>[])?.push(...point);
        (this.option.series[indexSerieOrigin].data as [number, number][])?.push(...originPoints[index]);
        (this.optionOver.series[index].data as Partial<IGeneratePoint>[])?.push(...point);
      }

      this.instance.setOption({...this.option})

    });
  }

  /**
   * Creates item data for a given element dataset.
   *
   * @param {IGrafico} elementDataseInput - The element dataset.
   * @param {Array<Array<IGeneratePoint>>} [dataOrigin] - The array of data origin.
   * @param {number} [index] - The index of the item data.
   * @return {Partial<ICreateItemData<any>>} - The created item data.
   */
  createItemData(elementDataseInput: IGrafico, dataOrigin?: Array<Array<IGeneratePoint>>, index?: number): Partial<ICreateItemData<any>> {
    return {
      name: elementDataseInput.name + ' - origin',
      type: 'line',
      //symbol: 'none',
      sampling: 'average',
      showSymbol: false,
      animation: false,
      lineStyle: {
        color: elementDataseInput.color,
        //width: 1 ,
        type: 'dashed',
      },
      itemStyle: {
        color: elementDataseInput.color,
      },

      data: elementDataseInput.dataset.map(({timestamp, valore_originale}) => ([timestamp + (60 * 60 * 1000), valore_originale] as [number, number])),
      markArea: {
        itemStyle: {
          // color: 'rgba(255, 173, 177, 0.2)'
        },
        data: [],
      },
    };
  }


  /**
   * Creates a new series item.
   *
   * @param {IPropsCreateSerie} props - The properties to configure the series item.
   * @param {IGrafico} props.item - The item data.
   * @param {string} props.color - The color of the series.
   * @param {boolean} [props.primoSep=false] - Whether the series is the first separator.
   * @param {boolean} [props.datiVisibili=false] - Whether the series data is visible.
   * @param {number} [props.decimal=0] - The decimal precision of the series data.
   *
   * @returns {Object} - The created series item.
   */
  private _createSerie<T>({item, color, primoSep = false, datiVisibili = false, decimal = 0}: IPropsCreateSerie): ICreateItemData<T> {

    return {
      id: Math.random() * 100,
      xAxisIndex: 0,
      yAxisIndex: 0,
      name: item.name,
      type: 'line',
      symbol: 'none',
      showSymbol: false,
      symbolSize: this.getSizeToPeriodo(item.dataset.length),
      smooth: false,
      animation: false,
      lineStyle: {
        width: item.parametro.key.includes('|') ? 1.5 : 0.8,
        // width: 0.8,
        color,
        type: item.parametro.key.includes('|') ? 'dashed' : 'line',
      },
      markArea: {
        data: primoSep ? [
          [{xAxis: 0}, {}]
        ] : [],
        itemStyle: {
          opacity: 0.3,
          //color: this.colorYellowChiaro
        },
        emphasis: {
          disabled: true,
        }
      },
      data: item.dataset.map(item => this.generatePoint(item, {min: 1, max: 1, notValidDataVisible: datiVisibili, isOrigin: false, visualizza: datiVisibili, decimal})),
      markLine: {
        symbol: ['none', 'arrow'],
        label: {show: false},
        data: []
      }
    }
  }

  createMarkLine(data: IGrafico) {
    return data.taratura?.map(tar => ({xAxis: tar.beginDate})) ?? [];
  }

  /**
   * Creates a series for displaying graphic data.
   * @param {ReadonlyArray<IGrafico>} grafici - An array of graphic data objects.
   * @param {number} [index] - The parameter to be used for creating the series.
   * @return {void}
   */
  createSeriesOver(grafici: ReadonlyArray<IGrafico>, index: number): void {
    this.localService.getTimeStore().subscribe(data => {
      let {dataInizioTime, dataFineTime} = data.periodo!;
      let utc = this.createUTC(+dataInizioTime!);
      let fineutc = this.createUTC(+dataFineTime!, (60 * 24))
      let serie = this.returnClone(grafici.map(grafico => this._createSerie<any>({
        item: grafico,
        color: grafico.color,
        primoSep: false,
        datiVisibili: false,
        decimal: grafico.parametro.decimalDigits
      })));
      serie = this.returnClone(serie.map((item, i) => ({
        ...item,
        z: 0,
        showSymbol: false,
        markArea: {
          itemStyle: {
            opacity: 0.3,
            color: this.colorOver,
          },
          data: index < 0 && i === 0 ? this.createMarkArea(grafici[i].dataset, grafici[i].parametro.measurementPeriod) : index >= 0 && i === index ? this.createMarkArea(grafici[index].dataset, grafici[index].parametro.measurementPeriod) : [],
        },
      })));
      this.optionOver.series = [...serie];
      this.optionOver.xAxis = {
        ...this._xAxis,
        min: utc,
        max: value => fineutc,
        // min: setHours(setMinutes(new Date(+dataInizioTime!), 0), 0).getTime(),
      }
    })

  }



  /**
   * This method generates a point based on the given input data.
   * @param {Dataset} dataset - The dataset containing the input data.
   * @param {IOptGenerate} option - The options for generating the point.
   * @returns {Partial<IGeneratePoint>} The generated point.
   */
  generatePoint({verification_flag, flag_validaz_autom, validity_flag, ...input}: Dataset, {
    min, max, notValidDataVisible = false, isOrigin = false,
    visualizza = false, decimal = 0 }: IOptGenerate): Partial<IGeneratePoint> {
    // let color = '#000';
    // let symbol = '';

    const {symbol, color} = this._determineSymbolColor(verification_flag, flag_validaz_autom, validity_flag);
    // color = __ret.color;
    // symbol = __ret.symbol;


    let point: Partial<IGeneratePoint> = {
      value: this.checkValue({verification_flag, flag_validaz_autom, validity_flag, ...input}, min, max, notValidDataVisible, isOrigin, decimal), //min && max?(input.valore_validato-min)*100/max:input.valore_validato,
      itemStyle: {},
      symbol: symbol,
      name: this.dateSettingService.generateNameToTimeStamp({timestamp: input.timestamp}),
      show: verification_flag !== 2,
      point_dataset: {verification_flag, flag_validaz_autom, validity_flag, ...input},
    };

    point = {
      ...point,
      itemStyle: {
        color: color,
        show: verification_flag !== 2,
      }
    };

    if (input.tipologia_validaz == 'FFF') {
      point = {
        ...point,
        itemStyle: {
          color: this.coloreValoreFFF,
        },
        symbol: 'circle'
      }
    }

    if (!visualizza) {
      return this._changeVisibility(point);
    } else {
      return point;
    }
  }

  /**
   * Determina il colore e il simbolo per un dato insieme di flag di verifica e validità.
   *
   * @param {number} verification_flag - La flag che indica lo stato di verifica.
   * @param {string} flag_validaz_autom - Tla flag che indica lo stato di validazione automatica.
   * @param {number} validity_flag - La flag che indica lo stato di validità.
   * @return {{color: string, symbol: string}} Un oggetto contenente il colore e il simbolo.
   */
  private _determineSymbolColor(verification_flag: number,  flag_validaz_autom: string , validity_flag: number ): { color: string, symbol: string } {
    let color = '';
    let symbol = '';
    switch (verification_flag) {
      case 3:
        color = +flag_validaz_autom === 0 ? OptionGraficClass.colorBlue : OptionGraficClass.colorBlueScuro;
        symbol = +flag_validaz_autom === 0 ? 'circle' : 'square';
        break;
      default:
        /**
         “1”: pallino verde
         “2”: triangolo o rombo verde (oppure bordo verde e centro bianco … da provare se migliore)
         “3”: quadrato verde (oppure bordo verde e centro verde chiaro … da provare se migliore)
         “-99”: pallino arancione
         “-1”: pallino rosso
         **/

        switch (validity_flag) {
          case 1:
            color = this.colorGreen;
            symbol = 'circle';
            break;
          case 2:
            color = this.colorGreen;
            symbol = 'triangle';
            break;
          case 3:
            color = this.colorGreen;
            symbol = 'diamond';
            break;
          case -99:
          case -1:
            color = validity_flag === -99 ? this.colorOrange : 'red';
            symbol = 'square';
            break;
        }
        break;
    }
    return {color, symbol};
  }

  /**
   * Modifies the visibility of a point based on the validity and verification flags.
   *
   * @param {Partial<IGeneratePoint>} options - The options object containing the point dataset and item.
   * @param {point_dataset} options.point_dataset - The point dataset containing the validity and verification flags.
   * @param {...item} options.item - The item to be processed, containing a timestamp and value.
   * @returns {Partial<IGeneratePoint>} - The modified options object with the visibility modified point.
   */
  private _changeVisibility({point_dataset, ...item}: Partial<IGeneratePoint>): Partial<IGeneratePoint> {
    let {validity_flag, verification_flag} = point_dataset;
    let [timestamp, value] = item.value as [number, number | string];
    if (+validity_flag < 0 && verification_flag !== 3) {
      item.value = [timestamp, ''];
    }
    return {
      ...item,
      point_dataset
    }
  }

  /**
   * Checks the value based on given parameters and returns the result.
   *
   * @param {Dataset} data - The dataset containing the values.
   * @param {number} min - Minimum value for scaling (default is 1).
   * @param {number} max - Maximum value for scaling (default is 1).
   * @param {boolean} notValidDataVisible - Flag indicating whether to show not valid data (default is false).
   * @param {boolean} isOrigin - Flag indicating whether the value is the original value (default is false).
   * @param {number} decimal - Numero preso dal parametro per arrotondare il dato sul grafico
   * @returns {Array} - An array containing the timestamp and the calculated value.
   */
  checkValue({
               timestamp,
               validity_flag,
               verification_flag,
               valore_validato,
               valore_originale,
             }: Dataset, min: number = 1, max: number = 1, notValidDataVisible: boolean = false, isOrigin: boolean = false, decimal: number): [number, number | string] {

    // Verifica se il flag di verifica è uguale a 2, il flag di validità è negativo e notValidDataVisible è falso
    let verificaValidityDataVisibile = verification_flag === 2 && validity_flag < 0 && !notValidDataVisible;

    // Verifica se il flag di verifica è uguale a 1, il flag di validità è negativo e notValidDataVisible è vero
    let validityDataVisibileVerifica = verification_flag === 1 && validity_flag < 0 && notValidDataVisible;
    // Trasformo il timestamp per l'UTC
    let timeUTC = timestamp + (60 * 60 * 1000);

    if (verificaValidityDataVisibile && validity_flag !== 3) {
      return [timeUTC, ''];
    } else {
      if (validityDataVisibileVerifica && validity_flag !== 3) {
        return [timeUTC, valore_validato];
      } else {
        if (isOrigin) {
          return this.scaleType === 'relativa'
            ? [timeUTC, (((valore_originale - min) * 100) / (max - min))]
            : [timeUTC, valore_originale];
        } else {
          return this.scaleType === 'relativa'
            ? [timeUTC, (((valore_validato - min) * 100) / (max - min))]
            : [timeUTC, valore_validato?.toFixed(decimal)];
        }
      }
    }
  }

  /**
   * @description Creates a marked area on the chart based on the input dataset.
   *
   * @param {Dataset[]} input - An array of datasets.
   * @param {number} tipoPeriodo - The period type of the chart.
   * @return {Object[]} - An array containing an object with xAxis properties representing the start and end marks of the area.
   * @example
   * createMarkArea(input);
   */
  createMarkArea(input: Dataset[], tipoPeriodo: number): Array<{ xAxis: number | undefined }[]> {
    let startMark = input[0].timestamp;
    if (tipoPeriodo === 1440) {
      //   Setto ul valore ad un gionro prima
      startMark = addDays(startMark, -1).getTime();
    }
    if (tipoPeriodo === 60) {
      startMark = setHours(setMinutes(new Date(startMark), 0), 0).getTime();
    }
    let endMark = input[input.length - 1].timestamp;
    return [[{xAxis: undefined}, {xAxis: undefined}]];
  }

  /**
   * @description Setta i valori di start & end dell'oggetto dataZoom
   * @param {number} start
   * @param {number} end
   * @returns {void}
   * @example
   * setZoomData(0, 100)
   */
  setZoomData(start: number, end: number): void {
    if (start === 0 && end === 100) {
      this._setPeriodo('full')
    }
    this.option.dataZoom![0] = {
      ...this.option.dataZoom![0],
      start,
      end,
    }
  }

  /**
   * @description Prende il form del periodo e lo setta
   * @param {PeriodType} periodo
   * @returns {void}
   * @example
   * setPeriodo('giornaliero')
   */
  private _setPeriodo(periodo: PeriodType): void {
    this._periodoFormControl.setValue(periodo, {emitEvent: false});
  }

  /**
   * Inizializza il formControl
   *
   * @param {FormControl} form - The form control to be initialized.
   *
   * @return {void}
   */
  initPeriodoFormControl(form: FormControl): void {
    this._periodoFormControl = form;
  }


  /**
   * @description Ritorna il valore della proprietà dataZoom
   * @returns {IDataZoom}
   * @example
   * let zoom = getZoomData();
   */
  getZoomData(): Partial<IDataZoom> {
    return this.option.dataZoom![0]
  }

  /**
   * @description Ritorna il valore della proprietà dataZoom della instance di echarts, il primo elemento dell'array
   * @returns {IDataZoom}
   * @example
   * let zoom = getInstanceZoomData();
   */
  getInstanceZoomData(): IDataZoom {
    let [primo] = this.instance.getOption()['dataZoom'] as IDataZoom[];

    return {
      ...primo,
      startValue: primo.startValue - (60 * 60 * 1000),
      endValue: primo.endValue - (60 * 60 * 1000),
    };
  }

  /**
   * @description Setta i valori dell'oggetto dataZoom
   * @param {Partial<IDataZoom>} value
   * @returns {void}
   * @example
   * setZoomDataOpt({startValue: 0, endValue: 100})
   */
  setZoomDataOpt(value: Partial<IDataZoom>): void {
    this.option.dataZoom![0] = {
      ...this.option.dataZoom![0],
      ...value,
    }
  }

  /**
   * @description Setta il valore della proprietà showSymbol
   * @param {number} index 'indice della serie'
   * @param {boolean} value 'validazione booleana'
   * @returns {void}
   * @example
   * setSymbolShow(0, true)
   * setSymbolShow(1, false)
   */
  setSymbolShow(index: number, value: boolean): void {
    if (!this.option.series[index]) {
      throw new Error('setSymbolShow: index non valido');
    }
    this.option.series[index].showSymbol = value;
  }

  /**
   * @description Setta il valore della proprietà symbolSize
   * @param {number} index 'indice della serie'
   * @param {number} value 'valore della grandezza del pallino'
   * @returns {void}
   * @example
   * setSymbolSize(0, 10)
   * setSymbolSize(1, 20)
   */
  setSymbolSize(index: number, value: number): void {
    if (!this.option.series[index]) {
      throw new Error('setSymbolSize: index non valido');
    }
    this.option.series[index].symbolSize = value;
    this.instance.setOption({...this.option});
  }

  /**
   * @description Setta il valore della proprietà showSymbol della serie passate
   * @param {Partial<ICreateItemData<any>>[]} series 'serie'
   * @param {number} index 'indice della serie'
   * @param {boolean} value 'validazione booleana'
   * @returns {void}
   * @example
   * setSymbolWithSeries(series, 0, true)
   * setSymbolWithSeries(series, 1, false)
   */
  setSymbolWithSeries(series: Partial<ICreateItemData<any>>[], index: number, {show, size, periodo}: Partial<{ show: boolean, size: number, periodo: number }>): void {
    //series[ index ].showSymbol = value;
    show = periodo && periodo <= this.lunghezzaPeriodo || false;
    let sizeSymbol = periodo && periodo >= 24 && periodo <= this.lunghezzaPeriodo ? this.getSizeToPeriodo(periodo) : !!size ? size : 10;
    series[index] = {
      ...series[index],
      showSymbol: show,
      symbolSize: sizeSymbol,
    }
  }

  /**
   * Sets the symbol size and show/hide flag for a given value and graph index.
   *
   * @param {number} value - The value used to calculate the symbol size and show/hide flag.
   * @param {number} indexGrafico - The index of the graph.
   * @returns {void}
   */
  setSymbolSizeWithValue(value: number, indexGrafico: number): void {
    let show = value && value <= this.lunghezzaPeriodo || false;
    let sizeSymbol = value && value >= 24 && value <= this.lunghezzaPeriodo ? this.getSizeToPeriodo(value) : 10;
    this.option.series[0] = {
      ...this.option.series[0],
      showSymbol: show,
      symbolSize: sizeSymbol,
    }
  }

  /**
   * Calculates the size to periodo ratio based on the given periodo.
   *
   * @param {number} periodo - The periodo in hours.
   * @return {number} The size to periodo ratio.
   */
  getSizeToPeriodo(periodo: number): number {
    switch (true) {
      case periodo && periodo >= 24 && periodo < 48:
        return 12;
      case periodo && periodo >= 48 && periodo < 72:
        return 10;
      case periodo && periodo >= 72 && periodo < 96:
        return 9;
      case periodo && periodo >= 96 && periodo < 144:
        return 8;
      case periodo && periodo >= 144 && periodo < 266:
        return 6;
      case periodo && periodo >= 266 && periodo < 745:
        return 4;
      default:
        return 10;
    }
  }

  /**
   * Performs the operation.
   *
   * @returns {string} The result of the operation.
   */
  operation(): string {
    return '';
  }

  /**
   * Reset the showAll property of each series in the option object.
   *
   * @returns {Partial<ICreateItemData<any>>[]} - An array containing the modified series objects.
   */
  resetShowAll(): Partial<ICreateItemData<any>>[] {
    return this.option.series.map((serie, index) => {
      return {
        ...serie,
        showSymbol: false,
        lineStyle: {
          ...serie.lineStyle,
          width: serie.lineStyle?.type === 'dashed' ? 1.5 : 0.8,
        },
        markArea: {
          ...serie.markArea,
          data: [],
        },
      };
    });
  }

  /**
   * @description Setta il valore Z della serie 0 in modo che sia sempre incrementata di uno
   */
  setZSerie0() {
    this.option.series = this.option.series.map((serie, index) => {
      return {
        ...serie,
        z: serie.z! + 1,
      }
    });
  }

  /**
   * @description Setta il valore Z della serie
   * @param {number} index
   * @param {Array<Partial<ICreateItemData<any>>>} series
   * @param {{start: number, end: number}} param2
   * @return void
   * @example
   * setZSerie(0, series);
   */
  setZSerie(index: number, series: Array<Partial<ICreateItemData<any>>>, {start, end}: { start: number, end: number }): Array<Partial<ICreateItemData<any>>> {
    return series.map((serie, i) => {
      return {
        ...serie,
        markArea: {
          ...serie.markArea,
          data: i === index ? [[{
            "xAxis": start
          }, {
            "xAxis": end
          }]] : [],
          zlevel: 0
        },
        z: i === index ? 1 : 0,
      }
    });
  }

  serColorItemStyle(indice: number, rga: string) {
    this.option.series[indice].markArea!.itemStyle = {
      ...this.option.series[indice].markArea?.itemStyle,
      color: rga,
    }
  }

  /**
   * @description Restituisce la data della serie
   * @param index {number}
   * @return Partial<IGeneratePoint>[]
   * @example
   * let data = graphicOptions.getDataOfSerie(0);
   * @output
   * Partial<IGeneratePoint>[] | [number, number][];
   */
  getDataOfSerie(index: number): Partial<IGeneratePoint>[] {
    return this.option.series[index].data as Partial<IGeneratePoint>[];
  }

  /**
   * @description Setta il valore della istanza di echarts
   * @param ec {EChartsType}
   * @return void
   * @example
   * graphicOptions.setInstance(ec);
   */
  setInstance(ec: EChartsType): void {
    this.instance = ec;
  }

  setSeriesOver(seriesOver: Partial<ICreateItemData<any>>[]) {
    this.optionOver.series = seriesOver;
  }

  /**
   * @description Cerchiamo l'index della serie tramite il nome della stessa
   * @param name {string}
   * @param opt {{origin?: true}}
   * @return number
   * @example
   * let index = graphicOptions.findIndexToName('nomeStruttura');
   */
  findIndexToName(name: string, opt?: Partial<{ origin: boolean; overView: boolean }>): number {
    if (opt?.origin) {
      name = name.concat(' - origin');
    }
    let lista = opt?.overView ? this.getSeriesOver() : this.option.series;
    return lista.findIndex(({name: nameOrig}) => nameOrig === name);
  }

  /**
   * @description Rimuovo la serie tramite un l'indice e la posiziono in prima posizione
   * @param index {number}
   * @param series {Array<T>}
   * @return void
   * @example
   * graphicOptions.removeAndMoveSeriesToIndex(0);
   */
  removeAndMoveSeriesToIndex<T>(index: number, series: Array<Partial<ICreateItemData<any>>>): Array<Partial<ICreateItemData<any>>> {
    let listZ = Math.max(...series.map(serie => serie.z ?? 0));

    let temp = series.splice(index, 1)[0];
    temp.z = listZ + 1;
    series.unshift(temp);
    return series;
  }

  /**
   * @description Removes the border from the first series, if present
   * @param series - An array of series data
   * @returns - An array of series data with the border removed from the first series, if present
   */
  removeBorder(series: Partial<ICreateItemData<any>>[]): Partial<ICreateItemData<any>>[] {
    let temp = series.splice(0, 1)[0];
    if (temp.data?.some(item => 'itemStyle' in item)) {
      let newData = (temp.data as Array<Partial<IGeneratePoint>>)?.map(item => {
        if (item.itemStyle?.borderColor) {
          let {borderColor, borderWidth, ...style} = item.itemStyle;
          return {
            ...item,
            itemStyle: {
              ...style,
              color: borderColor,
            }
          }
        }
        return item;
      });
      temp = {
        ...temp,
        data: newData
      }
    }
    series.unshift(temp);
    return series;
  }

  /**
   * @description Ritorna il nome della serie tramite l'indice
   * @param index {number}
   * @return string
   * @example
   * let name = graphicOptions.getNameSerie(0);
   */
  getNameSerie(index: number): string {
    return this.getSerie(index)?.name ?? '';
  }

  /**
   * @description Elimina la serie tramite l'indice
   * @param index {number}
   * @param opt {{overView: boolean}}
   * @return void
   * @example
   * graphicOptions.removeSerie(0);
   */
  override removeSerie(index: number, opt?: { overView: boolean }): void {
    // seleziono la lista in base al parametro overView
    let lista = opt?.overView ? this.optionOver : this.option;
    // elimino la serie dalla lista e la salvo in una variabile
    let [primaSerie] = lista.series.splice(index, 1);
    // se la serie è la prima della lista e la lista è la lista è la overView
    if (opt?.overView && index === 0 && !!lista.series.length) {
      // prendo la prima serie dalla lista optionOver e la salvo in una variabile
      let [prima, ...listaSerie] = lista.series;
      // setto la prima serie optionOver con la serie eliminata
      prima = {
        ...prima,
        markArea: {
          ...prima.markArea,
          data: primaSerie.markArea?.data ?? [],
        }
      }
      // setto la lista series con la prima serie e la lista delle serie
      lista.series = [prima, ...listaSerie];
    }

  }

  /**
   * @description dato un valore ritorna l'indice della serie
   * @param indice {number}
   * @param time {string | number}
   * @param opt {{overView: boolean}}
   * @return number
   * @example
   * let index = graphicOptions.findIndexToValue('nomeStruttura');
   * let index = graphicOptions.findIndexToValue(0);
   * let index = graphicOptions.findIndexToValue('nomeStruttura', {overView: true});
   * let index = graphicOptions.findIndexToValue(0, {overView: true});
   */
  findIndexToValue(indice: number, time: string | number, opt?: { overView: boolean }): number {
    let lista = opt?.overView ? this.optionOver : this.option;
    let listaPoint = lista.series[indice].data as Partial<IGeneratePoint>[] ?? [];
    return listaPoint.findIndex(({value}) => value![0] === time);
  }

  /**
   * @description Setta il valore della proprietà showSymbol
   * @param {number} index 'indice della serie'
   * @param {string} color 'colore che si vuole settare'
   * @returns {void}
   * @example
   * setColorSeries(0, 'red');
   * setColorSeries(1, 'red');
   */
  setColorSeries(index: number, color: string): void {
    let serie = this.getSerie(index);
    let seriesOverElement = this.getSeriesOver()[index];
    serie.itemStyle = {
      ...serie.itemStyle,
      color,
    }
    serie.lineStyle = {
      ...serie.lineStyle,
      color,
    }
    seriesOverElement.itemStyle = {
      ...seriesOverElement.itemStyle,
      color,
    }
    seriesOverElement.lineStyle = {
      ...seriesOverElement.lineStyle,
      color,
    }

    this.setSerie(index, serie);
    this.setSerieOver(index, seriesOverElement);
  }

  /**
   * @description Setta il valore della proprietà showSymbol
   * @param {number} index 'indice della serie'
   * @param {string} name 'nome della serie'
   * @param {number} value 'lunghezza periodo'
   * @returns {void}
   * @example
   * setSymbolShow(0, null, true);
   * setSymbolShow(1, 'nomeStruttura', true);
   * setSymbolShow(1);
   */
  viewPallini(index: number | null, name?: string, value: number = 0): void {
    let indexSerie = null;
    if (index != null) {
      indexSerie = index;
    } else {
      indexSerie = this.findIndexToName(name ?? '');
    }


    this.setSymbolShow(indexSerie, value <= this.lunghezzaPeriodo);
    this.setSymbolSize(indexSerie, this.getSizeToPeriodo(value));
  }

  /**
   * @description Setta il valore dell'oggetto xAxis
   * @param yAxis {Partial<IYAxis>}
   * @return void
   * @example
   * graphicOptions.setXAxis({type: 'category', data: ['2019-01-01', '2019-01-02', '2019-01-03']});
   * graphicOptions.setXAxis({min: 0, max: 100});
   */
  setYAxis(yAxis: Partial<IYAxis>) {
    this.option.yAxis = {
      ...this.option.yAxis,
      ...yAxis,
    }
  }

  /**
   * @description Ritorna l'oggetto yAxis
   * @return Partial<IYAxis>
   * @example
   * let yAxis = graphicOptions.getYAxis();
   */
  getYAxis(): Partial<IYAxis> {
    return this.option.yAxis!;
  }

  /**
   * @description Calcola il valore massimo e minimo dell'asse x
   * @param indice {number} 'indice della serie'
   * @param opt {{overView: boolean}} 'se true prende i dati dalla serie overView'
   *
   * @return {min: number, max: number}
   * @example
   * let {min, max} = graphicOptions.getMinMaxXAxis();
   * let {min, max} = graphicOptions.getMinMaxXAxis({overView: true});
   */
  getMinMaxYAxis(indice: number, opt?: { overView: boolean }): { min: number, max: number } {
    let listaPointValue = this.extractedLista(indice, opt);
    let listaPointNumber: Array<number> = [];

    if ('value' in listaPointValue[0]) {
      listaPointNumber = (listaPointValue as Partial<IGeneratePoint>[]).map(({value}) => value![1]);
    } else {
      listaPointNumber = (listaPointValue as [number, number][]).map(([, value]) => value);
    }

    return {
      min: Math.min(...listaPointNumber),
      max: Math.max(...listaPointNumber),
    }
  }

  /**
   * @description Calcola il valore massimo e minimo della data ch'è un array di [number, number] or Partial<IGeneratePoint>
   * @param data {Partial<IGeneratePoint>[] | [number, number][]}
   * @return {min: number, max: number} 'ritorna il valore massimo e minimo'
   * @example
   * let {min, max} = graphicOptions.getMinMaxToData(data);
   * @output
   * {min: number, max: number}
   */
  getMaxMinToData(data: Partial<IGeneratePoint>[] | [number, number][]): { min: number, max: number } {
    let listaPointNumber: Array<number> = [];
    if ('value' in data[0]) {
      // Prendo i valori della serie e tolgo i null or vuoti
      listaPointNumber = (data as Partial<IGeneratePoint>[]).map(({value}) => value![1]).filter(item => !!item);
    } else {
      listaPointNumber = (data as [number, number][]).map(([, value]) => value).filter(item => !!item);
    }

    return {
      min: Math.min(...listaPointNumber),
      max: Math.max(...listaPointNumber),
    }
  }


  /**
   * @description Ritorna il Type della serie che potrebbe essere Partial<IGeneratePoint>[] | [number, number][]
   * @param indice {number} 'indice della serie'
   * @param opt {{overView: boolean}} 'se true prende i dati dalla serie overView'
   * @return serie Partial<IGeneratePoint>[] | [number, number][]
   * @example
   * let listaPoint = graphicOptions.extractedLista(indice);
   * let listaPoint = graphicOptions.extractedLista(indice, {overView: true});
   * @output
   * Partial<IGeneratePoint>[] | [number, number][];
   */
  private extractedLista(indice: number, opt?: { overView: boolean | undefined }) {
    let lista = opt?.overView ? this.optionOver : this.option;
    let listaPoint: Partial<IGeneratePoint>[] | [number, number][] = [];
    // verifico se la serie non ha origin nel nome
    if (lista.series[indice].name!.includes('origin')) {
      listaPoint = lista.series[indice].data as [number, number][] ?? [];
    } else {
      listaPoint = lista.series[indice].data as Partial<IGeneratePoint>[] ?? [];
    }
    return listaPoint;
  }

  /**
   * @description Calcola la somma dei valori di una serie
   * @param indice {number} 'indice della serie'
   * @param opt {{overView: boolean}} 'se true prende i dati dalla serie overView'
   * @return Record<string, {lunghezza: number; tot: number}>
   * @example
   * let {lunghezza, tot} = graphicOptions.getSumSerie(indice);
   * let {lunghezza, tot} = graphicOptions.getSumSerie(indice, {overView: true});
   */
  getSumSerie(indice: number, opt?: { overView: boolean }): { lunghezza: number, tot: number } {
    let listaPointValue = this.extractedLista(indice, opt);

    let listaPointNumber: Array<number> = [];

    if ('value' in listaPointValue[0]) {
      listaPointNumber = (listaPointValue as Partial<IGeneratePoint>[]).map(({value}) => value![1]);
    } else {
      listaPointNumber = (listaPointValue as [number, number][]).map(([, value]) => value);
    }

    let tot = listaPointNumber.reduce((a, b) => a + b, 0);
    return {
      lunghezza: listaPointValue.length,
      tot,
    }
  }

  /**
   * @description Ritorna il valore massimo e minimo dell'assi x
   * @return Record<string, {min: number, max: number}>
   * @example
   * let {nomeSerie} = graphicOptions.getAllMinMaxXAxis();
   * let {nomeSerie} = graphicOptions.getAllMinMaxXAxis({overView: true});
   */
  getAllMinMaxYAxis(opt?: { overView: boolean }): void {
    this.setLabelYAxis(true);
    let lista = opt?.overView ? this.optionOver : this.option;
    // Itero la lista delle serie
    lista.series.forEach(({name, data}, index, serie) => {
      let {min, max} = this.getMaxMinToData(data!);
      // Creo una copia del dataSet all'interno delle serie
      serie[index].dataAfterRelativa = this.returnClone(data!);
      // Verifico che esista un attributo value all'interno del dataSet
      if ('value' in data![0]) {
        serie[index].data = (data as Partial<IGeneratePoint>[]).map(({value, ...item}) => ({
          ...item,
          value: [value![0], !value![1] ? value![1] : this.getPercentValue(value![1], {min, max})]
        }));
      } else {
        serie[index].data = (data as [number, number][]).map(([time, value]) => ([time, this.getPercentValue(value, {min, max})]) as [number, number]);
      }
    });

    // Setto la instanza del grafico
    this.instance.setOption({...this.option});
  }

  /**
   * @descrizione Checks if the first series in the given option object has any data points with non-null borderWidth in their itemStyle.
   *
   * @returns {boolean} - Returns true if any data point in the first series has non-null borderWidth in its itemStyle. Otherwise, returns false.
   */
  hasBorderWidthInFirstSeries(): boolean {
    if (this.option && this.option.series && this.option.series[0] && this.option.series[0].data) {
      return this.option.series[0].data.some((item: any) => item.itemStyle && item.itemStyle.borderWidth != null);
    }
    return false;
  }

  /**
   * Sets the label format for the Y-axis.
   *
   * @param {boolean} [relativa=false] - A flag indicating whether the label format should be relative (in percentage) or not.
   *
   * @return {void}
   */
  setLabelYAxis(relativa: boolean = false): void {
    this.option.yAxis.axisLabel.formatter = relativa ? '{value} %' : '{value}';
  }


  /**
   * @description Riporto i dati originali
   *
   */
  restoreData() {
    this.setLabelYAxis();
    this.option.series.forEach(({data, dataAfterRelativa}, index, serie) => {
      serie[index].data = dataAfterRelativa ? dataAfterRelativa : data;
      serie[index].dataAfterRelativa = undefined;
    });
  }

  /**
   * @description Ritorna il tot e la lunghezza di tutte le serie
   * @param indice {number} 'indice della serie'
   * @param opt {{overView: boolean}} 'se true prende i dati dalla serie overView'
   *
   * @return Record<string, {lunghezza: number, tot: number}>
   * @example
   * let {nomeSerie} = graphicOptions.getAllSumSerie(indice);
   * let {nomeSerie} = graphicOptions.getAllSumSerie(indice, {overView: true});
   */
  getAllSumSerie(opt?: { overView: boolean }): Record<string, { lunghezza: number, tot: number }> {
    let lista = opt?.overView ? this.optionOver : this.option;
    let listaSum: Record<string, { lunghezza: number, tot: number }> = {};
    lista.series.forEach(({name}, index) => {
      listaSum[name!] = this.getSumSerie(index, opt);
    });
    return listaSum;
  }

  /**
   * @description Riceve un valore e lo trasforma in relativo percentuale intero
   * @param value {number} 'valore da trasformare'
   * @param opt {{max: number, min: number}} 'valore massimo e minimo'
   * @return number
   * @example
   * let percent = graphicOptions.getPercentValue(value);
   */
  getPercentValue(value: number, {min, max}: { max: number, min: number }): number {
    return Math.round((value - min) / (max - min) * 100);
  }

  /**
   * Calcola il valore assoluto basato su una percentuale data e un intervallo.
   *
   * @param {number} percent - Il valore percentuale.
   * @param {Object} range - L'intervallo che contiene i valori `min` e `max`.
   * @param {number} range.min - Il valore minimo dell'intervallo.
   * @param {number} range.max - Il valore massimo dell'intervallo.
   * @return {number} - Il valore assoluto calcolato.
   * @example
   * let absoluteValue = getAbsoluteValue(50, {min: 0, max: 100});
   */
  getAbsoluteValue(percent: number, {min, max}: { min: number, max: number }): number {
    return Math.round((percent / 100) * (max - min) + min);
  }

  /**
   * Calculates the number of days between the first and last dates in the series.
   *
   * @returns {number} The number of days between the first and last dates.
   */
  getDays(): number {
    let {options, series} = this.instance.getOption();
    let serieData = series as Partial<ICreateItemData<any>>[];
    let first = serieData[0].data![0];
    let last = serieData[0].data![serieData[0].data!.length - 1];
    if ('value' in first && 'value' in last) {
      let firstValue = first.value![0];
      let lastValue = (last).value![0];
      return differenceInCalendarDays(lastValue, firstValue);
    }

    return differenceInCalendarDays(last as [number, number][0], first as [number, number][0]);

  }

  /**
   * @description Ritorna la differenza in numero tra due date che sia in formato stringa o in formato timestamp
   * @return number
   * @example
   * let dif = graphicOptions.getDaysToData('2019-01-01', '2019-01-02');
   * let dif = graphicOptions.getDaysToData(1546300800000, 1546387200000);
   */
  getDaysToData(start: string | number, end: string | number): number {
    // Creo le variabili per il calcolo
    let startTime = 0;
    let endTime = 0;
    // Verifico che sia una stringa e che abbia un formato valido
    let verificoStartString = typeof start === 'string' && !isValid(new Date(start));
    let verificoEndString = typeof end === 'string' && !isValid(new Date(end));
    // Verifico che sia un numero ma che non sia un numero valido
    let verificoStartNumber = typeof start === 'number' && !isValid(new Date(start));
    let verificoEndNumber = typeof end === 'number' && !isValid(new Date(end));
    // Se non è una stringa e non è un numero valido
    if (verificoStartString || verificoEndString || verificoStartNumber || verificoEndNumber) {
      throw new Error('start date or end date non è una data valida');
    }
    // Verificato che sia una string e che sia valido lo trasformo in timestamp
    if (!verificoStartString && !verificoEndString) {
      startTime = new Date(start).getTime();
      endTime = new Date(end).getTime();
      // Verificato che sia un numero e che sia valido
    } else if (!verificoStartNumber && !verificoEndNumber) {
      startTime = start as number;
      endTime = end as number;
    }


    return differenceInCalendarDays(endTime, startTime);
  }

  getGrafici() {
    return this.grafici;
  }

  getGraficoToName(name: string) {
    return this.grafici.find(grafico => grafico.name === name);
  }

  getTaraturaToName(name: string) {
    return this.grafici.find(grafico => grafico.name === name)?.taratura;
  }

  createTaratura(taratura: ITaratura[]) {
    return taratura.map(tar => ({xAxis: tar.beginDate}));
  }


  /**
   * @description Marca l'area della serie
   * @param index {number} 'indice della serie'
   * @param data {ChangeRenderParamsType} 'dati per il render'
   * @return void
   * @example
   * graphicOptions.setRender('valid', 0);
   * - non validi: validity = -1 o - 99 (default)
   * - non validati: verification = 3
   * - non certificati: verification !=1
   * - mancanti: codice = MMM o "---"
   * - nessuno: nulla di evidenziato
   */
  setRender(data: ChangeRenderParamsType, index: number) {
    if (index < 0) {
      throw new Error('Non hai selezionato nessun parametro');
    }
    let serie = this.option.series[0].data! as IGeneratePoint[];

    let arrayIsNull = [] as Array<Array<{ xAxis?: number, name?: string }>>;
    for (let i = 0; i < serie!.length; i++) {
      let {point_dataset: point, value} = serie[i];
      let {point_dataset: next_point, value: next_value} = serie[i + 1] ?? {point_dataset: undefined, value: undefined};
      let {verification_flag = null, validity_flag = null, tipologia_validaz = null} = point ?? {};
      let {verification_flag: nextVerificationFlag = null, validity_flag: nextValidytyFlag = null, tipologia_validaz: nextTipologiaValidaz = null} = next_point ?? {};
      // valore con validity_flag = -1 o -99
      let current = undefined;
      // valore successivo con validity_flag = -1 o -99
      let next = undefined;
      if (data === 'notvalid') {
        current = validity_flag === -1 || validity_flag === -99;
        next = nextValidytyFlag === -1 || nextValidytyFlag === -99;
      }
      if (data === 'notvalidate') {
        current = verification_flag === 3;
        next = nextVerificationFlag === 3;
      }
      if (data === 'notcertified') {
        current = verification_flag !== 1;
        next = nextVerificationFlag !== 1;
      }
      if (data === 'missing') {
        current = tipologia_validaz === 'MMM' || tipologia_validaz === '---';
        next = nextTipologiaValidaz === 'MMM' || nextTipologiaValidaz === '---';
      }
      // Caso in qui il primo valore invalido è quello successivo al corrente
      if ((!current && current !== undefined) && next && next_value) {
        arrayIsNull.push([value && value[0] ? {xAxis: value[0]} : {xAxis: next_value[0]}, {xAxis: null}]);
      }
      // Caso in cui il primo valore invalido è quello corrente e non c'è un valore successivo
      if (current && (!next && next !== undefined)) {
        let ultimoItem = arrayIsNull.length - 1;
        !arrayIsNull.length ?
          arrayIsNull.push([{xAxis: value![0]}, {xAxis: value![0]}]) :
          arrayIsNull[ultimoItem] = [{xAxis: arrayIsNull[ultimoItem][0].xAxis}, next_value && next_value[0] ? {xAxis: next_value[0]} : {xAxis: value![0]}];
      }
      // Caso in cui il corrente e il successivo sono invalidi e l'array di invalidi è vuoto
      if (current && next && !arrayIsNull.length) {
        arrayIsNull.push([{xAxis: value[0]}, {xAxis: null}]);
      }

    }
    this.option.series = this.option.series.map(item => ({...item, markArea: {...item.markArea, itemStyle: {...item.itemStyle, color: this.colorValoreNonValidato}, data: []}}));
    this.option.series[index].markArea!.data = arrayIsNull;
  }

  /**
   * @description Set the border width of the point
   * @param {number} index - The index of the point
   * @param {number} [value=3] - The border width value to set (default is 3)
   * @return {void}
   */
  setBorderWidth(index: number, value: number = 3): void {

    let {color, ...item} = (this.option.series[0].data![index] as Partial<IGeneratePoint>).itemStyle!;
    let new_item: IItemStyle = {
      ...item,
      borderWidth: item.borderWidth ? undefined : value,
      borderColor: item.borderColor ? undefined : color,
      color: color === 'white' ? item.borderColor : 'white',
    };
    (this.option.series[0].data![index] as Partial<IGeneratePoint>).itemStyle = {
      ...new_item
    }
  }

  /**
   * Sets the border width and border color of all data points in the first series.
   *
   * @method setAllBorderWidth
   * @memberOf class
   *
   * @returns {void} - This method does not return anything.
   */
  setAllBorderWidth(style: IItemStyle): void {
    this.option.series[0].data = (this.option.series[0].data as Partial<IGeneratePoint>[]).map(item => {
      return {
        ...item,
        itemStyle: {
          ...style,
        }
      }
    })
  }

  /**
   * @description Index del dataset della serie
   * @param {Partial<IGeneratePoint>} set - Oggetto contenente i dati del punto da cercare
   * @return {number} - L'indice del dataset nel quale è presente il punto specificato. Se il punto non viene trovato, viene restituito -1.
   */
  getIndexDataset({point_dataset: set}: Partial<IGeneratePoint>): number {
    // return this.option.series[ 0 ].data?.findIndex( ( { point_dataset } ) => point_dataset?.index === index ) ?? -1;
    return (this.option.series[0].data as Partial<IGeneratePoint>[]).findIndex(({point_dataset}) => point_dataset?.timestamp === set.timestamp) ?? -1;
  }

  /**
   * @description Prendo il time e lo trasformo in UTC ad un min
   */
  createUTC(timestamp: number, min: number = 1): number {
    let {dayUTC, monthUTC, hoursUTC, minutesUTC, yearUTC} = this.dateSettingService.convertToUTC(new Date(timestamp + (60 * 60 * 1000)));
    let dateUTC = Date.UTC(yearUTC, monthUTC, dayUTC, 0, min, 0);
    // console.info(new Date(dateUTC).toUTCString());
    return dateUTC;
  }


  /**
   * Aggiunge il periodo specificato al timestamp dato in base al tipo di evento.
   * Il tipo di evento determina se il periodo sarà aggiunto o sottratto,
   * o se verrà aggiunto un periodo fisso specifico (es. 1, 3, 7, 30 giorni).
   *
   * @param {number} timestamp - Il timestamp iniziale a cui verranno aggiunti i giorni.
   * @param {PeriodType} evento - Il tipo di evento che specifica come verrà aggiunto il periodo.
   * @param {number} [periodo] - Il numero di unità del tipo di periodo da aggiungere. Predefinito a 0 se non specificato.
   * @return {number} - Il nuovo timestamp dopo aver aggiunto il periodo al timestamp iniziale.
   */
  addDaysToTime(timestamp: number, evento: PeriodType, periodo?: number): number {
    let dateUTC = this.createUTC(timestamp, 0);

    // Il valore di un giorno in millisecondi (24 ore)
    let giorno = 24 * 60 * 60 * 1000;

    // Converte il periodo specificato in giorni in millisecondi
    let periodoToDay = (periodo || 0) * giorno;
    return this._calculateDate(evento, {dateUTC, giorno, periodo, periodoToDay});
  }


  /**
   * Metodo di supporto privato per calcolare la data in base al tipo di evento fornito.
   *
   * @param { PeriodType } evento - The type of event that determines how the date will be calculated.
   * @param {IPropsCalcoloPeriodo} props - The initial date in UTC format.
   * @returns {number} - The new date calculated based on the event type.
   */
  private _calculateDate(evento: PeriodType, {dateUTC, giorno, periodo, periodoToDay}: IPropsCalcoloPeriodo): number {
    switch (evento) {
      case "1":
      case "3":
      case "7":
      case "30":
        return dateUTC + (+evento * giorno);
      case "prec":
        if (!periodo) {
          throw new Error('Nessun periodo selezionato');
        }
        return dateUTC - periodoToDay;
      case "succ":
        if (!periodo) {
          throw new Error('Nessun periodo selezionato');
        }
        return dateUTC + periodoToDay;
      default:
        return 0;
    }
  }

  /**
   * @description Ricerca il primo valido del dataset della serie
   * @param {number} timestamp 'data inizio periodo richiesto'
   * @param {number} timeEnd 'data fine periodo richiesto
   * @param {PeriodType} action 'azione da eseguire'
   * @return {number} 'indice del dataset'
   * @example
   * let index = graphicOptions.getFirstValid(timestamp);
   */
  getFirstValid(timestamp: number, timeEnd: number, action: PeriodType): number {
    let lista = this.option.series[0].data as Partial<IGeneratePoint>[];
    // Prendo il primo valore del dataset e lo setto con minuti 1 e ore 0 con setMinutes e setHours
    let [first] = lista;
    // Prendo il l'ultimo valore della lista e lo setto con minuti 0 e ore 0 con setMinutes e setHours
    let ultimoTimeDateSet = lista[lista.length - 1];
    let date = new Date(first.value![0]);
    let dateEnd = new Date(ultimoTimeDateSet.value![0]);
    let setFirstelement = setHours(setMinutes(date, 0), 0);
    let setLastelement = setHours(setMinutes(dateEnd, 0), 0);
    let setTimeStamp = setHours(setMinutes(setSeconds(new Date(timestamp), 0), 0), 0);
    let setEndTimeStamp = setHours(setMinutes(setSeconds(new Date(timeEnd), 0), 0), 0);
    let formatStamp = format(setTimeStamp, 'yyyy-MM-dd HH:mm:ss');
    let formatFirst = format(setFirstelement, 'yyyy-MM-dd HH:mm:ss');
    let formatLast = format(setLastelement, 'yyyy-MM-dd HH:mm:ss');
    let formatEnd = format(setEndTimeStamp, 'yyyy-MM-dd HH:mm:ss');

    // Considero se sono su event = prec prendo il primo valore del dataset
    if (action === 'prec' && formatStamp === formatFirst) {
      return 0;
    }
    // Verifico che siamo su event = succ e che il timeEnd sia minore dell'ultimo valore del dataset
    if (action === 'succ' && formatEnd > formatLast) {
      return -1;
    }
    return lista.findIndex(({point_dataset}) => action === 'succ' ? point_dataset?.timestamp >= timestamp : point_dataset?.timestamp <= timestamp);
  }

  /**
   * Sets the mark area data for the series in the 'optionOver' object.
   */
  setMarkAreaOver(): void {
    this.optionOver.series.forEach((element: any, i: number, list: Array<any>) => {
      list[i].markArea.data = [];
    });
  }

  /**
   * @description Clears the rendering of the chart by resetting the data values and styles of the markArea elements in each series.
   * The color of the markArea elements is set to "colorValoreNonValidato" and the data is cleared.
   *
   * @returns {void} No return value.
   */
  clearRender(): void {
    this.option.series = this.option.series.map(item => ({...item, markArea: {...item.markArea, itemStyle: {...item.itemStyle, color: this.colorValoreNonValidato}, data: []}}));
  }

  /**
   * @description Settiamo i valori del item della serie come di default
   * @param {Partial<ICreateItemData<any>>[]} series 'serie'
   * @return {Partial<ICreateItemData<any>>[]} 'serie'
   * @example
   * let series = graphicOptions.setDefaultItemSerie(series);
   */
  setDefaultItemSerie(series: Partial<ICreateItemData<any>>[]): Partial<ICreateItemData<any>>[] {
    return series = series.map(serie => {
      return {
        ...serie,
        lineStyle: {
          ...serie.lineStyle,
          width: 0,
        },
      };
    })
  }

  /**
   * @description Calcolo il valore relativo di un valore
   * @param value {number} 'valore da trasformare'
   * @param opt {{max: number, min: number}} 'valore massimo e minimo'
   * @return number
   * @example
   * let percent = graphicOptions.getRelativeValue(value);
   */
  getRelativeValue(value: number, {min, max}: { min: number, max: number }): number {
    return Math.round((value - min) / (max - min) * 100);
  }
}
