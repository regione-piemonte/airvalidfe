/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component , Input , OnInit , Output } from '@angular/core';
import { BarChart , LineChart } from 'echarts/charts';

import { DataZoomComponent , GraphicComponent , GridComponent , LegendComponent , MarkAreaComponent , ToolboxComponent , TooltipComponent , VisualMapComponent , VisualMapPiecewiseComponent , } from 'echarts/components';
import { BehaviorSubject , filter , Observable , } from 'rxjs';
import * as moment from 'moment';
import { Moment } from 'moment';
import { DataService } from 'src/app/core/services/data/data.service';
import { DialogService } from '../dialogs/services/dialog.service';
import { NgxSpinnerService } from 'ngx-spinner';

import 'moment/locale/it';
import { FormGroup } from '@angular/forms';
import { MatDialog , MatDialogConfig } from '@angular/material/dialog';
import { DialogMaxMinComponent } from '../dialogs/dialog-max-min/dialog-max-min.component';
import { ThemeColorService } from 'src/app/core/services/utility/theme-color.service';
import { Dataset , IGrafico , IOutput } from '../../../core/models/grafico';
import { IParameter } from '../../../core/models/dataService';
import { ECharts } from 'echarts';
import { OptionGraficClass } from './compositive_grafic/optionGraficClass';
import { DatasService } from '../../../core/services/api/datas/datas.service';
import { ICreateItemData , IDataZoom , IGeneratePoint , IOptionGrafic , PeriodType } from './compositive_grafic/models';
import { IValueDataOutput } from '../validazione-dettaglio/validazione-dettaglio.component';
import { DialogInfoComponent } from '../dialogs/dialog-info/dialog-info.component';
import { LocalService } from '../../../core/services/locale/local.service';
import { TranslateService } from '@ngx-translate/core'
import { LanguageService } from 'src/app/core/services/locale/language.service'
import { addDays , setHours , setMinutes } from 'date-fns';

export type TypeUnion = {
  name?: string
};

@Component( {
  selector: 'app-grafico' ,
  templateUrl: './grafico.component.html' ,
  styleUrls: [ './grafico.component.scss' ] ,
} )
export class GraficoComponent implements OnInit {
  @Input() dataSetInput?: Observable<IGrafico[]>;
  @Input() visibilityNotValidDataSeries: Observable<{ name: string; visibilityNotValid: number }> = new Observable();
  @Input() visibilitySeries: Observable<any> = new Observable();
  @Input() deleteSeries: Observable<string> = new Observable();
  @Input() changeColorSeries: Observable<{ name: string; color: string }> = new Observable();
  @Input() changeValueInput!: Observable<IValueDataOutput>;
  @Output() outputSeries: BehaviorSubject<any> = new BehaviorSubject( null );

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
  selectedRenderGraph: any;
  valoriInputGrafico: IGrafico[] = [];
  periodoDays: number = 0;
  choiceModeRender: any;
  private _colors: string[] | null = null;
  private start: number = 0;
  private end: number = 100;
  private graphicOptions: OptionGraficClass = new OptionGraficClass();


  constructor(
    private dataService: DataService ,
    private readonly datasService: DatasService ,
    private dialogService: DialogService ,
    private spinner: NgxSpinnerService ,
    private translateService: TranslateService ,
    private languageService: LanguageService ,
    private dialog: MatDialog ,
    private themeColorService: ThemeColorService ,
    private readonly localeService: LocalService ,
  ) {
    this.echartsExtentions = [
      BarChart ,
      LineChart ,
      ToolboxComponent ,
      DataZoomComponent ,
      TooltipComponent ,
      GridComponent ,
      LegendComponent ,
      MarkAreaComponent ,
      VisualMapComponent ,
      VisualMapPiecewiseComponent ,
      GraphicComponent ,
    ];

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
  private _getParametroSelezionato( parameter: IParameter ): string {
    return parameter.parametro.name + ' - ' + parameter.stazione.name;
  }

  /**
   * @description Metodo per ricevere il valore delle date salvate su localStore
   * @returns {startDate: string, endDate: string} oggetto con le date
   * @example
   * let {startDate, endDate} = this.getStartAndEndLocalDate();
   * @output
   * {startDate: '01/01/2021', endDate: '01/01/2021'}
   */
  private getStartAndEndLocalDate(): { startDate: string, endDate: string } {
    return {
      startDate: this.localeService.getItem( 'startDate' ) ,
      endDate: this.localeService.getItem( 'endDate' ) ,
    }
  }

  /**
   * @description Metodo che prende le data dalla store per impostare la data d'inizio e fine
   */
  private _setStartAndEndDatePersonalized( personalized: boolean = true ) {
    let { startDate , endDate } = this.getStartAndEndLocalDate();
    if ( personalized ) {
      this.startDatePersonalized = startDate;
      this.endDatePersonalized = endDate;
    }
    if ( !personalized ) {
      this.startDate = startDate;
      this.endDate = endDate;
    }
  }

  private _createGraficoAfterItemSelect( indexParameter: number , parameter?: IParameter , dataset?: Array<Dataset> ) {
    let { markArea , data , serie , markLine } = this._returnMarkAreaParametroSelected( indexParameter );

    this.graphicOptions.resetSeries( indexParameter );

    this.graphicOptions.setSerie( indexParameter , {
      ...serie ,
      markArea ,
      data ,
      showSymbol: !!dataset ? dataset.length < this.graphicOptions.lunghezzaPeriodo: false ,
      symbolSize: this.graphicOptions.getSizeToPeriodo( dataset?.length ?? 0 ) ,
      name: parameter?.parametro.name + ' - ' + parameter?.stazione.name
    } );

    this.echartsOptions = { ...this.graphicOptions.option };
  }

  private _returnMarkAreaParametroSelected( indexParameter: number ) {
    let { markArea , data , markLine , ...serie } = this.graphicOptions.getSerie( indexParameter );

    let arrayIsNull: Array<Array<{ xAxis?: number }>> = [];

    this._markArea( data as Array<Partial<IGeneratePoint>> , arrayIsNull );


    markArea = {
      ...markArea ,
      itemStyle: {
        ...markArea?.itemStyle ,
        opacity: 1 ,
        color: this.graphicOptions.colorValoreNonValidato ,
      } ,
      data: [
        ...arrayIsNull ,
      ]
    };

    return { markArea , data , markLine , serie , };
  }

  private _markArea( data: Array<Partial<IGeneratePoint>> , arrayIsNull: Array<Array<{ xAxis?: number }>> ) {
    for ( let i = 0 ; i < data.length ; i++ ) {
      const [ current_xAxis = null , currentValue = null ] = data[ i ]?.value ?? [];
      const [ next_xAxis = null , nextValue = null ] = data[ i + 1 ]?.value ?? [];
      if ( !currentValue && nextValue ) {
        let ultimoItem = arrayIsNull.length - 1;
        !arrayIsNull.length ?
          arrayIsNull.push( [ { xAxis: null } , { xAxis: next_xAxis } ] ):
          arrayIsNull[ ultimoItem ] = [ { xAxis: arrayIsNull[ ultimoItem ][ 0 ].xAxis } , { xAxis: next_xAxis } ];
      }
      if ( currentValue && !nextValue ) {
        arrayIsNull.push( [ { xAxis: current_xAxis } , { xAxis: null } ] );
      }
    }
    if ( !arrayIsNull.length ) {
      arrayIsNull.push( [ { xAxis: data[ 0 ]?.value![ 0 ] } , { xAxis: data[ data.length - 1 ].value![ 0 ] } ] );
    }
  }

  private _hasSuccessOfSetPeriod( periodo: PeriodType ): boolean {
    // verifico che non ci siano dati modificati
    if ( this.dataService.getToSaveValue().size > 0 ) {
      this.periodSelected = periodo;
      this.dialogService.openInfoDialog(
        'Attenzione' ,
        'Sono presenti dati modificati.<br/>Procedere con il salvataggio o ripristinare il dataset' ,
        undefined ,
        'error'
      );
      return false;
    }


    // verifico se è stato selezionato un parametro e che non sia il periodo personalizzato
    if ( this.indiceSelezionato < 0 && this.periodSelected != 'personalized' ) {

      this.dialogService.openInfoDialog(
        'Attenzione' ,
        'Non è stato selezionato alcun parametro<br/>Procedere con la selezione del parametro'
      );

      this.periodSelected = 'personalized';

      return false;
    }


    return true;
  }

  private getArrayDateComplete( startDate: number | string , stopDate: string | number , action?: PeriodType ) {
    let number = this.graphicOptions.findIndexToName( this.parametroSelezionato );
    let dataOfSerie = this.graphicOptions.getDataOfSerie( number );
    return action && action === 'full' ? dataOfSerie.map( item => ( [ ...item.value! ] ) ): dataOfSerie
      .filter( item => item.value![ 0 ] >= startDate && item.value![ 0 ] <= stopDate )
      .map( item => ( [ ...item.value! ] ) );
  }

  private _setGraficoAndTable( event: PeriodType , startDate?: number | string  , stopDate?: number | string  ) {
  let firstElementArrayDate = this.arrayDateComplete?.[ 0 ]?.[ 0 ];
    let number = this.graphicOptions.findIndexToValue( this.indiceSelezionato , firstElementArrayDate );
    let lastElementArrayData = this.arrayDateComplete[ this.arrayDateComplete.length - 1 ]?.[ 0 ] as number;
    let numberEnd = this.graphicOptions.findIndexToValue( this.indiceSelezionato , lastElementArrayData );

    this.start = this._percentualeDaIndice( number , this.graphicOptions.getSerie( this.indiceSelezionato ).data?.length ?? 0 );
    this.end = this._percentualeDaIndice( numberEnd , this.graphicOptions.getSerie( this.indiceSelezionato ).data?.length ?? 0 );
    //this.setMinMaxDataZoom();

    this.graphicOptions.setZoomDataOpt( {
      startValue: event == 'personalized'
        ? this.startDatePersonalized
        : firstElementArrayDate ,
      endValue:
        event == 'personalized'
          ? this.endDatePersonalized
          : lastElementArrayData ,
      start: undefined ,
      end: undefined ,
    } );

    let options = this.graphicOptions.option;
    this.startDatePersonalized = firstElementArrayDate;
    this.endDatePersonalized = lastElementArrayData;

    let datasetOutputDettaglio: Array<Dataset> = [];

    this._createInputDataTable( datasetOutputDettaglio , options );
    this._setMarkAreaOver( event , firstElementArrayDate , lastElementArrayData , startDate , stopDate );
    this.graphicOptions.setOption( options );
    this.graphicOptions.instance.setOption( { ...this.graphicOptions.option } );
    // this.echartsOptions = this.graphicOptions.option;
    this.hideSpinner();
  }

  private _setMarkAreaOver( event: PeriodType , firstElementArrayDate?:  number , lastElementArrayData?:  number , startDate?: string | number , stopDate?: string | number ) {
    this.graphicOptions.optionOver.series.map( ( element: any , i: number , list: Array<any> ) => {
      list[ i ].markArea.data = [];
    } );

    let newVar = event === 'full' ? [ { xAxis: firstElementArrayDate } , { xAxis: lastElementArrayData } ]: [ { xAxis: +startDate! } , { xAxis: +stopDate! } ];
    // this._createGraficoAfterItemSelect( this.indiceSelezionato , this.dataService.getDataset()[ this.indiceSelezionato ]?.parametro! );

    this.graphicOptions.optionOver.series[ 0 ].markArea!.data = [ newVar ];
    this.echartsOptionsOverView = this.graphicOptions.returnClone( this.graphicOptions.optionOver );
  }

  private _createInputDataTable( datasetOutputDettaglio: Array<Dataset> , options: IOptionGrafic ) {
    function filterDataset( dataset: Array<Dataset> , listaDate: ReadonlyArray<number[]> ) {
      let firstDataElement = listaDate[ 0 ][ 0 ];
      let lastDataElement = listaDate[ listaDate.length - 1 ][ 0 ];
      return dataset.filter( ( data ) => data.timestamp >= firstDataElement && data.timestamp <= lastDataElement
      );
    }

    if ( this.indiceSelezionato > -1 ) {
      let graficoSelezionato = this.valoriInputGrafico.find( ( { name } ) => name == this.parametroSelezionato );
      if ( !graficoSelezionato ) {
        throw new Error( 'Grafico non trovato' );
      }
      datasetOutputDettaglio = this.graphicOptions.returnClone( filterDataset( graficoSelezionato?.dataset , this.arrayDateComplete ) );

      let output: IOutput = {
        dataset: datasetOutputDettaglio ,
        index: 0 ,
        parameter: {} ,
      };

      let arrayFilter: Array<IGrafico> = [];
      this.valoriInputGrafico.forEach( ( element: IGrafico , index: number , lista ) => {
        let el = { ...element };
        el.dataset = this.graphicOptions.returnClone( filterDataset( element.dataset , this.arrayDateComplete ) );
        arrayFilter.push( el );
      } );
      output.parameter = graficoSelezionato;

      if ( options.legend?.selected[ graficoSelezionato.name ] ) {
        // options.series[ this.indiceSelezionato ].showSymbol = arrayFilter && arrayFilter[ 0 ].dataset.length < 96;
        this._createGraficoAfterItemSelect( this.indiceSelezionato , graficoSelezionato , arrayFilter[ 0 ].dataset );

        this.echartsOptions = { ...options };

        this.dataService.setDatasetFiltered( arrayFilter );
        if ( this.parametroSelezionato && this.parametroSelezionato != '' ) {
          console.log( 'Output' , output );
          this.dataService.setParametersList( output );
          console.log( 'seriessss' , this.echartsOptions.series );
        }
      }
    }
  }

  private _startAndEndTime( indexStart: number , indexEnd: number , lunghezza: number , index: number = 0 ) {
    let timestamp = this.dataService.getDataset()[ index ].dataset[ indexStart ].timestamp;
    let timestampEnd = this.dataService.getDataset()[ index ].dataset[ indexEnd === lunghezza ? indexEnd - 1: indexEnd ].timestamp;
    return { timestamp , timestampEnd };
  }

  private _extraedIndexStartEnd<T>( e: T & { start: number, end: number, batch: Array<{ startValue: number, endValue: number }> } , selezionato: boolean = false ) {
    let indice = selezionato ? 0: this.indiceSelezionato >= 0 ? this.indiceSelezionato: 0;
    let name = this.graphicOptions.getNameSerie( 0 );
    let indiceGrafico = this.valoriInputGrafico.findIndex( ( { name: nameGrafico } ) => nameGrafico === name );
    let lunghezza = this.valoriInputGrafico[ indiceGrafico ].dataset.length;
    let zoomLength = e.batch?.length;
    if ( zoomLength ) {
      let lastBatch = e.batch[ zoomLength - 1 ];
      return { lunghezza , indexStart: lastBatch.startValue , indexEnd: lastBatch.endValue , indiceGrafico };
    }
    this.start = e.start ? e.start: 0;
    this.end = e.end ? e.end: 100;
    let { indexStart , indexEnd } = this._startAndEndIndex( lunghezza );
    return { lunghezza , indexStart , indexEnd , indiceGrafico };
  }

  private _startAndEndIndex( lunghezza: number ) {
    let { end , start } = this.graphicOptions.getInstanceZoomData();
    let indexStart = this._indiceDaPercentuale( start , lunghezza );
    let indexEnd = this._indiceDaPercentuale( end , lunghezza );
    if ( indexEnd === lunghezza ) {
      indexEnd = indexEnd - 1;
    }
    return { indexStart , indexEnd };
  }

  private _indiceDaPercentuale( value: number , lunghezza: number ) {
    return Math.round( value * lunghezza / 100 );
  }

  private _percentualeDaIndice( value: number , lunghezza: number ) {
    return parseFloat( ( ( ( value + 1 ) / lunghezza ) * 100 ).toFixed( 8 ) );
  }

  private _createDateToPeriod( day: number ): ReadonlyArray<string> {
    let array: string[] = [];
    let currentDate = moment();
    for ( let i = 0 ; i <= Math.abs( day ) ; i++ ) {
      let itemMoment = moment( this.currentDate ).add( i , 'days' );
      if ( itemMoment.isSameOrBefore( currentDate , 'day' ) ) {
        array.push( itemMoment.format( 'DD/MM/YYYY' ) );
      }
    }
    return array;
  }

  private _startDateAndEndDateToArray( arrayDate: ReadonlyArray<string> , action?: PeriodType ) {
    let first = arrayDate[ 0 ];
    let last = arrayDate[ arrayDate.length - 1 ];
    let startDate =
      this.periodSelected == 'personalized'
        ? this.startDatePersonalized
        : moment( first + '01:00' , 'DD/MM/YYYY HH:mm' )
          .utcOffset( 2 , false )
          .valueOf();

    let stopDate =
      this.periodSelected == 'personalized'
        ? this.endDatePersonalized
        : setMinutes( setHours( new Date( last?.split( '/' ).reverse().join( '-' ) ) , 0 ) , 0 ).valueOf();
    // nel caso che le date siano uguali
    if ( startDate! >= stopDate ) {
      stopDate = moment().tz( 'Europe/Rome' ).valueOf();
    }

    let successivo = action === 'succ';
    let precedente = action === 'prec';
    if ( typeof startDate === 'number' && precedente || successivo ) {
      this.localeService.verifyTimezone( precedente ? startDate: successivo ? stopDate: undefined , action );
    }
    return { startDate , stopDate };
  }

  private _createDayAndCurrentDateToPeriod( event: "1" | "3" | "7" | "30" | "full" | "personalized" | "succ" | "prec" ) {
    switch (event) {
      case 'succ':
        this.currentDate = moment( this.currentDate ).add(
          this.days < 30 ? this.days: 1 ,
          this.days < 30 ? 'days': 'M'
        );
        break;
      case 'prec':
        this.currentDate = moment( this.currentDate ).subtract(
          this.days < 30 ? this.days: 1 ,
          this.days < 30 ? 'days': 'M'
        );
        break;
      case 'personalized':
        // this.days = moment(options.xAxis.data[0]).diff(moment(options.xAxis.data[options.xAxis.data.length-1]), 'days')//options.xAxis.data.length - 1;
        console.log( 'Inizio' , this.startDatePersonalized );
        console.log( 'Fine' , +this.endDatePersonalized );
        let a = moment( +this.startDatePersonalized! ); //.format('DD/MM/YYYY')
        let b = moment( +this.endDatePersonalized ); //.format('DD/MM/YYYY')

        this.days = b.diff( a , 'days' ) + 1; //options.xAxis.data.length - 1;
        console.log( 'days' , this.days );
        break;
      case 'full':
        const { startDate , endDate } = this.getStartAndEndLocalDate();
        this.currentDate = moment( +startDate );
        let startFull = moment( startDate ); //.format('DD/MM/YYYY')
        let endFull = moment( endDate ); //.format('DD/MM/YYYY')

        this.days = endFull.diff( startFull , 'days' ) + 1; //options.xAxis.data.length - 1;
        console.log( 'days' , this.days );
        break;
      default:
        let grafico = this.dataService.getIndexGraficoByName( this.parametroSelezionato )
        let { indexStart , indexEnd } = this._startAndEndIndex( this.graphicOptions.getSerie( this.indiceSelezionato ).data?.length! );
        let { timestamp , timestampEnd } = this._startAndEndTime( indexStart , indexEnd , this.graphicOptions.getSerie( this.indiceSelezionato ).data?.length! , grafico );

        if ( timestamp ) {
          this.currentDate = moment(
            moment( timestamp ).format( 'DD/MM/YYYY' ) + ' 02:00' ,
            'DD/MM/YYYY HH:mm'
          )
            .utc( false )

        }
        this.days = +event;
        console.log( 'days' , this.days );
        break;
    }
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
  private _getIGraficosOriginOrNot( origin: boolean = true ) {
    return this.valoriInputGrafico.filter( item => origin ? item.name.endsWith( '- origin' ): !item.name.endsWith( '- origin' ) );
  }

  /**
   * @description Metodo per apertura spinner time
   */
  private showSpinner() {
    this.spinner.show( 'time' );
  }

  /**
   * @description Metodo per chiusura spinner time
   */
  private hideSpinner() {
    this.spinner.hide( 'time' );
  }

  private _selectPeriodToTable( indexStart: number , indexEnd: number ) {
    let aggiornaIndice = this.valoriInputGrafico.findIndex( ( ( { name } ) => name == this.parametroSelezionato ) );

    let datasetOutputDettaglio = this.valoriInputGrafico[ aggiornaIndice ].dataset.slice( indexStart , indexEnd + 1 );

    let output: IOutput = {
      dataset: datasetOutputDettaglio ,
      index: aggiornaIndice ,
      parameter: this.valoriInputGrafico[ aggiornaIndice ] ,
    };

    this.dataService.setParametersList( output );
    return { aggiornaIndice , datasetOutputDettaglio };
  }

  /**
   * @description Metodo per selezionare i valori da inserire in tabella
   */
  private _selectValuesToTable(): { indiceGrafico: number; timeStamps: Dataset[] } {
    let indiceGrafico = this.valoriInputGrafico.findIndex( ( ( { name } ) => name == this.parametroSelezionato ) );
    let { startValue , endValue } = this.graphicOptions.getInstanceZoomData();
    let timeStamps = this.valoriInputGrafico[ indiceGrafico ].dataset.filter( ( data ) => data.timestamp >= startValue! && data.timestamp <= endValue! );
    let output: IOutput = {
      dataset: timeStamps ,
      index: indiceGrafico ,
      parameter: this.valoriInputGrafico[ indiceGrafico ] ,
    };
    this.dataService.setParametersList( output );
    return { indiceGrafico , timeStamps };
  }


  ngOnInit() {
    this.updateTheme();
    moment.tz.setDefault( 'Europe/Berlin' );
    moment.locale( 'it' );
    moment.updateLocale( 'it' , null );
    this._setStartAndEndDatePersonalized();
    this.translationOption();

    this.dataService.selectedParameter$
      .pipe(
        filter( value => !!value && !!Object.keys( value ).length ) ,
      )
      .subscribe( ( { parameter , index: indexParameter } ) => {
        // parte lo spinner
        this.showSpinner();
        this.periodoDays = this.graphicOptions.getDays();
        let { startValue: start , endValue: end } = this.graphicOptions.getInstanceZoomData();
        if ( start && end ) {
          this.graphicOptions.setZoomDataOpt( { startValue: start , endValue: end , start: undefined , end: undefined } );
        }

        let notselectParameter = this.parametroSelezionato !== this._getParametroSelezionato( parameter! );
        if ( parameter && parameter.visible && notselectParameter ) {
          this.parametroSelezionato = this._getParametroSelezionato( parameter );
          this.indiceSelezionato = indexParameter!; //this.echartsOptions.series.map((x :any)=>x.name).findIndex((x:any)=>x==this.parametroSelezionato)
          let aggiornaIndice = this.graphicOptions.findIndexToName( this.parametroSelezionato );
          this._createGraficoAfterItemSelect( aggiornaIndice , parameter );
          let graficoItemSelezionato = this.valoriInputGrafico[ indexParameter! ];
          let datasetOutputDettaglio: Dataset[] = [];

          let { startValue: start , endValue: end } = this.graphicOptions.getInstanceZoomData();
          if ( start && end ) {
            datasetOutputDettaglio = graficoItemSelezionato.dataset.filter( ( data ) => data.timestamp >= start! && data.timestamp <= end! );
          } else {
            let { indexStart , indexEnd } = this._startAndEndIndex( graficoItemSelezionato.dataset.length );
            let { timestamp: startValue } = graficoItemSelezionato.dataset[ indexStart ];
            let { timestamp: endValue } = graficoItemSelezionato.dataset[ indexEnd ];
            datasetOutputDettaglio = graficoItemSelezionato.dataset.filter( ( data ) => data.timestamp >= startValue && data.timestamp <= endValue );
          }

          let output: IOutput = {
            dataset: datasetOutputDettaglio ,
            index: this.indiceSelezionato ,
            parameter: parameter ,
          };

          this.dataService.setParametersList( output );
          // this.graphicOptions.serColorItemStyle( aggiornaIndice , ' );

          let series = this.graphicOptions.resetShowAll();

          this.graphicOptions.setSymbolWithSeries( series , aggiornaIndice , { periodo: output.dataset.length } );

          series[ aggiornaIndice ].lineStyle = {
            ...series[ aggiornaIndice ].lineStyle ,
            type: parameter.parametro.key.includes( '|' ) ? 'dotted': 'line' ,
            width: parameter.parametro.key.includes( '|' ) ? 4: 2 ,
            // width: 1.5,
          };
          // elimino item dalla lista e poi lo inserisco in prima posizione
          series = this.graphicOptions.removeAndMoveSeriesToIndex( aggiornaIndice , series );

          this.graphicOptions.setSeries( series );
          this.echartsOptions = { ...this.graphicOptions.option };
        } else if ( !parameter?.visible ) {
          let parametersList = this.dataService.getParametersList();
          // se non è visibile il parametro selezionato non ho ancora nulla in tabella
          if ( parametersList ) {
            this.parametroSelezionato = '';
            let output: IOutput = {
              dataset: [] ,
              index: indexParameter! ,
              parameter: parameter ?? {} ,
            };

            this.dataService.setParametersList( output );
          }

        }

        // chiudo lo spinner
        this.hideSpinner();
      } );

    // Sottoscrizione per il cambio valore
    this.changeValueInput
      .pipe(
        filter( value => !!value ) ,
      )
      .subscribe( ( val ) => {

        let parameter = val.input.parameter;
        let seriesName = `${ parameter?.parametro?.name } - ${ parameter?.stazione?.name }`;

        /**
         * @description Funzione che verifica se il valore è un array o un oggetto
         */
        function isArrayOrObject( value: any ): boolean {
          if ( Array.isArray( value ) ) {
            return value[ 0 ] === val.indice
          }
          if ( typeof value === 'object' && 'value' in value ) {
            return value.value[ 0 ] === val.indice
          }
          return false;
        }

        const mapFindIndex = ( serie: ReadonlyArray<Partial<ICreateItemData<any>>> ) => {
          return serie.map( ( { name } ) => name ).findIndex( ( name ) => name === seriesName );
        }

        /**
         * @description Funzione che mappa l'array o l'oggetto per farlo uscire come valore
         */
        function mapArray( value: any ) {
          if ( typeof value === 'object' && 'value' in value ) {
            return value.value
          }
          return value;
        }

        if ( val ) {
          let series = this.graphicOptions.getSeries();

          let indexTime = this.graphicOptions.getSerie( this.indiceSelezionato ).data?.findIndex( isArrayOrObject );
          let index = mapFindIndex( series );
          let key = parameter?.parametro?.key ?? '';
          let { value } = val;

          this.dataService.addSaveValue( key , value );


          let numbers = series[ index ].data!.map( mapArray ).map( ( [ time , value ]: [ number , number ] ) => value );
          let min = Math.min( ...numbers );
          let max = Math.max( ...numbers );

          series[ index ].data![ indexTime! ] = this.graphicOptions.generatePoint( val.value , min , max , true );
          this.echartsOptionsOverView.series[ index ].data[ indexTime! ] = this.generatePoint( val.value , 1 , 1 , true );

          ( series[ index ].data![ indexTime! ] as Partial<IGeneratePoint> ).point_dataset.valore_validato = val.value.valore_validato;

          this.echartsOptionsOverView.series[ index ].data[ indexTime! ].point_dataset.valore_validato = val.value.valore_validato;

          this.graphicOptions.setSeries( series );
          // this.setMinMaxDataZoom();
          // in questo caso devo eliminare il valore start e end del dataZoom
          // this.graphicOptions.setZoomDataOpt( { start: undefined , end: undefined } );
          // this.echartsOptions = this.graphicOptions.returnOption();
          this.graphicOptions.instance.setOption( { ...this.graphicOptions.option } );
          this.echartsOptions = { ...this.graphicOptions.option };
          this.echartsOptionsOverView = { ...this.echartsOptionsOverView };
        }
      } );

    // Sottoscrizione per il cambio colore
    this.changeColorSeries
      .pipe(
        filter( value => !!value.name )
      )
      .subscribe( ( val ) => {
        this.updateTheme();
        let listaDataset = this.dataService.getDataset();

        let index = this.graphicOptions.findIndexToName( val.name );
        this.graphicOptions.setColorSeries( index , val.color );

        let indexDataset = listaDataset.findIndex( ( { name } ) => name == val.name );
        listaDataset[ indexDataset ].color = val.color;

        this.setMinMaxDataZoom();
        this.echartsOptionsOverView = { ...this.graphicOptions.returnOption( { overView: true } ) };
      } );

    // Sottoscrizione per la cancellazione della serie
    this.deleteSeries
      .pipe(
        filter( value => !!value )
      )
      .subscribe( ( res: string ) => {

        this.updateTheme();
        let listaDataset = this.dataService.getDataset();

        let index = this.graphicOptions.findIndexToName( res );
        this.graphicOptions.removeSerie( index );
        let indexOrigin = this.graphicOptions.findIndexToName( res , { origin: true } );
        this.graphicOptions.removeSerie( indexOrigin );
        let indexGrafico = listaDataset.findIndex( ( { name } ) => name == res );
        listaDataset.splice( indexGrafico , 1 );
        let indexOverView = this.graphicOptions.findIndexToName( res , { overView: true } );
        this.graphicOptions.removeSerie( indexOverView , { overView: true } );

        this.echartsOptionsOverView = this.graphicOptions.returnOption( { overView: true } );
        this.setMinMaxDataZoom();
        this.indiceSelezionato = 0;
      } );

    //Sottoscrizione per la visibilità dati non validi della serie
    this.visibilityNotValidDataSeries
      .pipe(
        filter( value => !!value )
      )
      .subscribe( ( val ) => {
        this.updateTheme();

        console.clear();
        console.info( 'Valore dati non validi' , val );

        let { name } = val;

        let series = this.graphicOptions.getSeries();
        // let seriesOver = this.graphicOptions.getSeriesOver();
        let listaDataset = this.dataService.getDataset();
        const searchIndexToList = <T extends TypeUnion>( list: ReadonlyArray<T> ): number => {
          return list.map<string>( ( item ) => item?.name ?? '' ).indexOf( name );
        }

        let index = searchIndexToList( series );

        // let indexOverview = searchIndexToList( seriesOver );

        let indexDataset = searchIndexToList( listaDataset );

        listaDataset[ indexDataset ].visibleNotValid = val.visibilityNotValid >= 1;

        this.dataService.setDataset( listaDataset )

        let min = 0;
        let max = 0;
        let dataIndex = listaDataset[ indexDataset ].dataset ?? [];
        if ( val.visibilityNotValid < 1 ) {
          let listaValoriValidi = dataIndex.filter( ( { validity_flag } ) => validity_flag > 0 ).map( ( { valore_validato } ) => valore_validato ) as ReadonlyArray<number>;
          // nascondo
          min = Math.min( ...listaValoriValidi );
          max = Math.max( ...listaValoriValidi );
        } else {
          let listaValori = dataIndex?.map( ( { valore_validato } ) => valore_validato );
          min = Math.min( ...listaValori );
          max = Math.max( ...listaValori );
        }

        let dataSeries = series[ index ].data as Partial<IGeneratePoint>[] ?? [];

        // verifico se sono presenti dei dati da salvare
        if ( this.dataService.getIsSaved() ) {
          // nel caso che ci siano dati da salvare devo sostituire il dataindex con un altro array che contenga i valori modificati
          dataIndex = this.dataService.getArrayObservableData();
        }
        // let dataSeriesOver = seriesOver[ indexOverview ].data as Partial<IGeneratePoint>[] ?? [];

        dataIndex.forEach( ( { validity_flag , timestamp , valore_validato , ...item } , i ) => {
            // let { value: valueOver } = dataSeriesOver[ i ];
            if ( +validity_flag < 0 ) {
              if ( +val.visibilityNotValid < 1 ) {
                console.log( 'nascondo' );
                dataSeries[ i ].value = [ timestamp , '' ];
                // valueOver = [ timestamp , '' ];
              } else {
                console.log( 'mostro' );
                dataSeries[ i ].value = this.scaleType == 'relativa' ? [ timestamp , ( ( ( valore_validato - min ) * 100 ) / ( max - min ) ) ]: [ timestamp , valore_validato ];
                // valueOver = [ timestamp , valore_validato ];
              }
            } else {
              dataSeries[ i ].value = this.scaleType == 'relativa' ? [ timestamp , ( ( ( valore_validato - min ) * 100 ) / ( max - min ) ) ]: [ timestamp , valore_validato ];
              // valueOver = [ timestamp , valore_validato ];
            }
          }
        );

        series[ index ].data = dataSeries;
        this.graphicOptions.setSeries( series );

        this.echartsOptions = { ...this.graphicOptions.option };
        this.setMinMaxDataZoom( { start: undefined , end: undefined } );
      } );

    //Sottoscrizione per la visibilità della serie
    this.visibilitySeries
      .pipe(
        filter( value => !!value )
      )
      .subscribe( ( val ) => {
        this.showSpinner();

        if ( val ) {
          let index = this.valoriInputGrafico.findIndex( ( { name } ) => name == val );

          if ( !val.includes( 'origin' ) ) {
            let arrayFiltered = this.dataService.getDatasetFiltered();
            arrayFiltered[ index ].visible = !arrayFiltered[ index ].visible;
            this.dataService.setDatasetFiltered( arrayFiltered );
          }

          this.graphicOptions.option.legend!.selected[ val ] = !( this.graphicOptions.option.legend!.selected[ val ] );
          this.setMinMaxDataZoom();
          this.echartsOptions = { ...this.echartsOptions };
          this.echartsOptionsOverView = { ...this.echartsOptionsOverView };
        }
        this.hideSpinner();
      } );

    // Sottoscrizione per il rendering delle serie sul grafico
    this.dataSetInput?.pipe(
      filter( ( val ) => !!val?.length ) ,
    ).subscribe( ( grafici: IGrafico[] ) => {
      this.showSpinner();
      this.updateTheme();
      this._setStartAndEndDatePersonalized( false );
      this.graphicOptions.createSeries( grafici );
      this.valoriInputGrafico = this.graphicOptions.returnClone( [ ...grafici , ...grafici.map( grafico => ( { ...grafico , name: grafico.name + ' - origin' } ) ) ] );
      this.dataService.setDataset( this.valoriInputGrafico );
      this.dataService.setDatasetFiltered( this.valoriInputGrafico );
      // nel caso che ci sia un parametro selezionato allora dobbiamo ricaricare i valori nella tabella
      if ( this.indiceSelezionato > -1 ) {
        let { indexStart , indexEnd } = this._startAndEndIndex( this.valoriInputGrafico[ this.indiceSelezionato ].dataset.length );
        let { datasetOutputDettaglio } = this._selectPeriodToTable( indexStart , indexEnd );
        this.graphicOptions.viewPallini( null , this.parametroSelezionato , datasetOutputDettaglio.length );
      }

      if ( this.scaleType == 'relativa' ) {
        this.graphicOptions.getAllMinMaxYAxis();
      }

      this.echartsOptions = { ...this.graphicOptions.option };

      this.echartsOptionsOverView = this.graphicOptions.returnClone( this.graphicOptions.optionOver );

      this.hideSpinner();
    } );
  }


  /**
   * @description sottoscrizione colore tema e modifica colore del testo dei grafici
   */
  updateTheme() {
    this.themeColorService.currentColor$.subscribe( ( value ) => {
      if ( value ) {
        this.themeColorMode = value;
      }
    } );
  }

  setScale( event: string , fondoScala?: number , minFondoScala?: number ) {
    console.log( 'Evento scala' , event );
    this.scaleType = event
    this.dataService.setScaleType( event )
    let yAxis = this.graphicOptions.getYAxis();
    this.graphicOptions.restoreData();
    switch (event) {
      case 'assoluta':
        this.showInputFondoscala = false;
        yAxis = {
          ...yAxis ,
          min: undefined ,
          max: undefined ,
        };
        break;
      case 'manuale':
        this.showInputFondoscala = true;
        yAxis = {
          ...yAxis ,
          min: undefined ,
          max: undefined ,
        };
        this.openMinMaxDialog();
        break;
      case 'impostaManuale':
        yAxis = {
          ...yAxis ,
          min: minFondoScala ,
          max: fondoScala ,
        };
        break;
      case 'relativa':
        this.showInputFondoscala = false;
        yAxis = {
          ...yAxis ,
          min: 0 ,
          max: 100 ,
        }
        let allMinMaxYAxis = this.graphicOptions.getAllMinMaxYAxis();
        break;
      default:
        yAxis = this.graphicOptions.getYAxis();
    }
    this.graphicOptions.setYAxis( yAxis );
    this.graphicOptions.instance.setOption( { ...this.graphicOptions.option } )
  }

  openMinMaxDialog() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      id: 1 ,
      title: 'Selezione parametri' ,
    };

    const dialogRef = this.dialog.open( DialogMaxMinComponent , dialogConfig );

    dialogRef
      .afterClosed()
      .subscribe( ( data ) => {
        this.setScale( 'impostaManuale' , data.max , data.min );
      } );
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
  setPeriod( event: PeriodType ) {

    if ( event === 'personalized' ) {
      this.dialogService.openDialogSetPeriodoPersonalizzato().subscribe( {
        next: ( { end , start } ) => {
          console.info( 'Data' , { start , end } );
          let daysToData = this.graphicOptions.getDaysToData( start , end );
          let startDate = setMinutes( setHours( new Date( start ) , 1 ) , 0 ).getTime();
          let stopDate = daysToData < 1 ? addDays(setMinutes( setHours( new Date( end ) , 0 ) , 0 ), 1).getTime() : setMinutes( setHours( new Date( end ) , 0 ) , 0 ).getTime();
          this.arrayDateComplete = this.getArrayDateComplete( startDate , stopDate , event );

          this.graphicOptions.setZoomDataOpt( {
            startValue: startDate ,
            endValue: stopDate ,
            start: undefined ,
            end: undefined ,
          } );
          this.startDatePersonalized = startDate;
          this.endDatePersonalized = stopDate;
          this.days = daysToData;
          let option = this.graphicOptions.option;
          this.graphicOptions.instance.setOption( { ...option } );
          this.echartsOptions = { ...option };

          let datasetOutputDettaglio: Array<Dataset> = [];
          this._createInputDataTable( datasetOutputDettaglio , option );
          this._setMarkAreaOver(event, startDate, stopDate, startDate, stopDate);

        } ,
        error: err => {

        } ,
        complete: () => {}
      } )
    } else {


      this.showSpinner();

      let listaAction: 'succ' | 'prec' | undefined = undefined;

      this.periodoDays = this.graphicOptions.getDays();


      if ( !this._hasSuccessOfSetPeriod( event ) ) {
        this.hideSpinner();
        throw new Error( 'Non è stato possibile impostare il periodo' );
      }

      this.indiceSelezionato = this.graphicOptions.findIndexToName( this.parametroSelezionato );

      // prendo lo start o startValue dalla serie selezionata
      let { start , startValue , end , endValue } = this.graphicOptions.getZoomData();
      if ( startValue && endValue ) {
        this.currentDate = moment( startValue );
      }

      if ( event === 'succ' || event === 'prec' ) {
        listaAction = event;
        event === 'succ' ? this.counter++: this.counter--;
      }

      this._createDayAndCurrentDateToPeriod( event );

      // verifico che la data richiesta non sia nel futuro
      if ( !this.currentDate || this.currentDate > moment() ) {
        this.hideSpinner();
        this.dialog.open( DialogInfoComponent , {
          data: {
            title: 'Attenzione' ,
            message: 'Non è possibile richiedere dati del futuro' ,
            role: 'alert' ,
          }
        } )
        throw new Error( 'Data non valida, non possiamo richiedere valori del futuro' );
      }


      let arrayDate = this._createDateToPeriod( this.days );
      let { startDate , stopDate } = this._startDateAndEndDateToArray( arrayDate , listaAction );

      let hasStarEndAndPersonalized = this.startDatePersonalized && this.endDatePersonalized && this.periodSelected == 'personalized';
      if ( hasStarEndAndPersonalized ) {
        startDate = this.startDatePersonalized;
        stopDate = this.endDatePersonalized;
      }

      this.startDatePersonalized = startDate;
      this.endDatePersonalized = stopDate; //this.endDate

      this.arrayDateComplete = [];
      this.arrayDateComplete = this.getArrayDateComplete( startDate! , stopDate! , event );

      // verifico che dato un periodo anche la lunghezza del mio array sia corretta
      let lunghezzaOraria = this.arrayDateComplete.length < this.days * 24 && arrayDate.length > 1;
      let lunghezzaGiornaliera = this.arrayDateComplete.length != this.days;

      let notResultAndAction = !this.arrayDateComplete.length && !!listaAction;
      let hasResultAndAction = this.arrayDateComplete.length && !!listaAction;
      if ( notResultAndAction || ( hasResultAndAction && ( lunghezzaOraria && lunghezzaGiornaliera ) ) ) {
        // non ho una selezione nella mia serie
        // dovrei fare una chiamata al backend per avere i dati
        let listaParametro = this._getIGraficosOriginOrNot( false ).map( value => value.parametro );
        let mapsObj = listaParametro.map( ( { key , measurementPeriod } ) => this.datasService.getSensorData( key , measurementPeriod , { start: startDate! , end: stopDate } ) );

        this.datasService.getForkJoinSensorData( this.datasService.listaParameters , mapsObj ).subscribe( {
          next: value => {
            console.log( 'res' , value );

            value.forEach( ( { dataset , ...grafico } , index ) => {
              let length = this.valoriInputGrafico.length;
              this.dataService.setNewArrayDataSet( dataset , index , listaAction );
              this.dataService.setNewArrayDataSet( dataset , length / 2 + index , listaAction );
            } );
            this.graphicOptions.addSerieWithListGrafic( value , listaAction );
            this.arrayDateComplete = this.getArrayDateComplete( startDate! , stopDate! );
            this._setPeriodoGraficoOver();
            this._setGraficoAndTable( event , startDate , stopDate );
          } ,
          error: err => {

          } ,
          complete: () => {}
        } )

      } else {
        this._setGraficoAndTable( event , startDate , stopDate );
      }
    }


  }

  private _setPeriodoGraficoOver() {
    let { startDate: start , endDate: end } = this.localeService.getPeriodoLocal();
    this.startDate = start;
    this.endDate = end;
  }

  generatePoint( input: any , min?: number , max?: number , notValidDataVisible: boolean = false , isOrigin: boolean = false ): IGeneratePoint {
    let color = '#000';
    let symbol = '';

    // console.log('generate point', input);
    // console.log('generate point notValidDataVisible', notValidDataVisible);

    switch (input.verification_flag) {
      case 3:
        color = input.flag_validaz_autom == 0 ? '#03b1fc': 'blue';
        symbol = input.flag_validaz_autom == 0 ? 'circle': 'square';

        break;
      case 2:
        /*“1”: pallino verde
        “2”: triangolo o rombo verde (oppure bordo verde e centro bianco … da provare se migliore)
        “3”: quadrato verde (oppure bordo verde e centro verde chiaro … da provare se migliore)
        “-99”: pallino arancione
        “-1”: pallino rosso*/

        switch (input.validity_flag) {
          case 1:
            color = '#40D61A';
            symbol = 'circle';
            break;
          case 2:
            color = '#40D61A';
            symbol = 'triangle';
            break;
          case 3:
            color = '#40D61A';
            symbol = 'triangle';
            break;
          case -99:
            color = '#F17F04';
            symbol = 'square';
            break;
          case -1:
            color = 'red';
            symbol = 'square';
            break;
        }

        break;
      case 1:
        switch (input.validity_flag) {
          case 1:
            color = '#40D61A';
            symbol = 'circle';
            break;
          case 2:
            color = '#40D61A';
            symbol = 'triangle';
            break;
          case 3:
            color = '#40D61A';
            symbol = 'triangle';
            break;
          case -99:
            color = '#F17F04';
            symbol = 'square';
            break;
          case -1:
            color = 'red';
            symbol = 'square';
            break;
        }
        break;
    }

    //console.log('this.periodSelected', this.periodSelected);
    let point = {
      value: this.checkValue( input , min , max , notValidDataVisible , isOrigin ) , //min && max?(input.valore_validato-min)*100/max:input.valore_validato,
      itemStyle: {} ,
      symbol: symbol ,
      symbolSize: 10 , //+this.periodSelected==1|| +this.periodSelected==3 ? 5 : 10,
      show: input.verification_flag != 2 ,
      point_dataset: input ,
    };

    //if (input.verification_flag == 3 || input.verification_flag == 2) {
    point.itemStyle = {
      color: color ,
      // opacity:input.verification_flag == 2? 0 : 1,
      show: input.verification_flag != 2 ,
    };

    if ( input.validity_flag == 3 ) {
      point.itemStyle = {
        borderWidth: 3 ,
        borderColor: '#40D61A' ,
        color: 'transparent' ,
      };
    }

    if ( input.validity_flag == 2 ) {
      point.symbolSize = 16;
    }

    if ( input.tipologia_validaz == 'FFF' ) {

      point.itemStyle = {
        color: '#9EA2B6' ,
      }
      point.symbol = 'circle'
    }
    //}
    return point;
  }

  checkValue( input: any , min: any , max: any , notValidDataVisible: boolean , isOrigin: boolean ) {
    //console.log('input check', input);
    //min && max?(input.valore_validato-min)*100/max:input.valore_validato,
    if (
      +input.verification_flag == 2 &&
      +input.validity_flag < 0 &&
      !notValidDataVisible
    ) {
      //  console.log('nascondo');
      //  console.log("notValidDataVisible",notValidDataVisible)
      // input.value=''

      return [ input.timestamp , '' ]; //'';
    } else if (
      +input.validity_flag < 0 &&
      notValidDataVisible &&
      input.verification_flag == 1
    ) {
      return [ input.timestamp , '' ]; //'';
    } else {
      //console.log('mostro');
      // input.value=min && max?(input.point_dataset.valore_validato-min)*100/max:input.valore_validato

      if ( isOrigin ) {
        return this.scaleType == 'relativa'
          ? [ input.timestamp , ( ( ( input.valore_originale - min ) * 100 ) / ( max - min ) ) ]
          : [ input.timestamp , input.valore_originale ];
      } else {
        return this.scaleType == 'relativa'
          ? [ input.timestamp , ( ( ( input.valore_validato - min ) * 100 ) / ( max - min ) ) ]
          : [ input.timestamp , input.valore_validato ];
      }


      // return [input.timestamp, input.valore_validato];
    }
  }

  ricalcoloCambioScala( percentulaScale: boolean , dataZoom?: any ) {
    let data1: Array<Array<any>> = [ [] , [] ];
    let dataOrigin: Array<Array<any>> = [ [] , [] ];
    data1 = [];
    dataOrigin = [];

    this.dataService.getDataset().forEach( ( element ) => {
      data1.push( [] );
      dataOrigin.push( [] );
    } );

    let timeDateSet: Array<any> = [];
    let dataSet: Array<any> = [];

    this.dataService
      .getDataset()
      .forEach( ( elementDataseInput: any , index: number ) => {
        console.log( 'elementDataseInput' , elementDataseInput );
        let min = 0
        let max = 0
        if ( percentulaScale ) {
          min = elementDataseInput.visibleNotValid ? Math.min(
            ...elementDataseInput.dataset.map(
              ( item: any ) => item.valore_validato
            ) ): Math.min(
            ...elementDataseInput.dataset.filter( ( x: any ) => x.validity_flag > 0 ).map(
              ( item: any ) => item.valore_validato
            )
          );
          max = elementDataseInput.visibleNotValid ?
            Math.max(
              ...elementDataseInput.dataset.map(
                ( item: any ) => item.valore_validato
              )
            ): Math.max(
              ...elementDataseInput.dataset.filter( ( x: any ) => x.validity_flag > 0 ).map(
                ( item: any ) => item.valore_validato
              )
            )
          console.log( 'Min' , min );
          console.log( 'Max' , max );
        }

        elementDataseInput.dataset.forEach( ( element: any , i: number ) => {
          if ( index < 1 ) {
            timeDateSet.push( element.timestamp );
          }

          data1[ index ].push(
            this.generatePoint(
              element ,
              min , //? min : undefined,
              max ,//? max : undefined
              elementDataseInput.visibleNotValid ,
            )
          );
          dataOrigin[ index ].push( this.generatePoint(
            element ,
            min ,//? min : undefined,
            max ,//? max : undefined,
            elementDataseInput.visibleNotValid ,
            true
          ) );
        } );

        dataSet.push( {
          name: elementDataseInput.name + ' - origin' ,
          type: 'line' ,
          //symbol: 'none',
          sampling: 'average' ,
          show: false ,
          animation: false ,
          lineStyle: {
            color: elementDataseInput.color ,
            width: 5 ,
            type: 'dashed' ,
          } ,
          itemStyle: {
            color: elementDataseInput.color ,
          } ,

          data: dataOrigin[ index ] ,
          markArea: {
            itemStyle: {} ,
            data: [] ,
          } ,
        } );

        dataSet.push( {
          name: elementDataseInput.name ,
          type: 'line' ,
          //symbol: 'none',
          sampling: 'average' ,
          show: false ,
          animation: false ,
          lineStyle: {
            color: elementDataseInput.color ,
            //width: 5,
            type: elementDataseInput.parametro.key.includes( '|' ) ? 'dotted': 'line' ,
            width: elementDataseInput.parametro.key.includes( '|' ) ? 3: 1 ,
          } ,
          itemStyle: {
            color: elementDataseInput.color ,
          } ,

          data: data1[ index ] ,
          showSymbol: index == this.indiceSelezionato && data1[ index ].length < 96 ,
          //(index==this.indiceSelezionato*2+1) && +this.periodSelected>3 || this.periodSelected=='personalized' ?false:true,
          markArea: {
            itemStyle: {
              // color: 'rgba(255, 247, 127, 0.2)'
            } ,
            data: [] ,
          } ,
          /*  markArea: {
            itemStyle: {
              color: 'rgba(255, 173, 177, 0.4)',
            },
            data: [], //dataRed
          },*/
        } );

        console.log( '>index' , index );
        console.log( '>indiceSelezionato' , this.indiceSelezionato );
        console.log( '>indperiodSelected' , this.periodSelected );
      } );

    // this.initGrafico(
    //   dataSet ,
    //   this.echartsOptions.legend ,
    //   timeDateSet ,
    //   dataZoom
    // );
    //this.initGraficoOriginal(dataSet, this.echartsOptions.legend, timeDateSet);
  }

  onChartInitHtml( event: any , type: string ) {
    console.log( 'chart event:' , type , event );
    this.onChartInit( event );
  }

  onChartEvent( event: Event , type: string ) {
    console.log( 'chart event:' , type , event );
  }

  print() {
    console.log( 'debounce' );
  }

  private _startAndEndTimetoEchart( e: any & { batch?: Array<{ startValue: number, endValue: number }> } ) {
    let { startValue: timestamp , endValue: timestampEnd } = e.batch[ e.batch.length - 1 ];
    return { timestamp , timestampEnd };
  }

  onChartInit( ec: ECharts ) {

    this.graphicOptions.setInstance( ec );

    this.graphicOptions.instance.on( 'datazoom' , ( e: any & { batch?: Array<{ startValue: number, endValue: number }> } ) => {
      console.clear();
      console.log( 'Datazoom' , e );

      let { lunghezza , indexStart , indexEnd , indiceGrafico } = this._extraedIndexStartEnd( e );
      let { timestamp , timestampEnd } = e?.batch?.length ? this._startAndEndTimetoEchart( e ): this._startAndEndTime( indexStart , indexEnd , lunghezza , indiceGrafico );
      let newVar = [ { xAxis: timestamp } , { xAxis: timestampEnd } ];

      let dataDaSalvare = this.dataService.getToSaveValue().size;
      if ( this.parametroSelezionato && dataDaSalvare ) {
        this.dialog.open( DialogInfoComponent , {
          data: {
            title: 'Attenzione' ,
            message: 'Non possiamo muovere il grafico ci sono dati da salvare' ,
          }
        } ).afterClosed().subscribe( () => {
          this.graphicOptions.instance.setOption( { ...this.graphicOptions.option } );
          this.echartsOptions = { ...this.graphicOptions.option };
        } );
        throw new Error( 'Non possiamo muovere Datazoom perchè ' + dataDaSalvare + ' sono in salvataggio' );
      }

      if ( this.parametroSelezionato && !dataDaSalvare ) {
        this.periodSelected = 'personalized';

        let { timeStamps } = this._selectValuesToTable();

        this.echartsOptionsOverView.series.map( ( element: any , i: number , list: Array<any> ) => {
          list[ i ].markArea.data = [];
        } );

        let { lunghezza , indexStart: start , indexEnd: end , indiceGrafico } = this._extraedIndexStartEnd( e , true );
        let newVar = [ { xAxis: start } , { xAxis: end } ];
        if ( !e?.batch?.length ) {
          let { timestamp , timestampEnd } = e?.batch?.length ? this._startAndEndTimetoEchart( e ): this._startAndEndTime( start , end , lunghezza , indiceGrafico );
          newVar = [ { xAxis: timestamp } , { xAxis: timestampEnd } ];
        }


        this.echartsOptionsOverView.series[ 0 ].markArea.data = [ newVar ];
        this.echartsOptionsOverView = { ...this.echartsOptionsOverView };

        this.graphicOptions.viewPallini( null , this.parametroSelezionato , timeStamps.length );

        if ( e?.batch?.length ) {
          this.graphicOptions.setZoomDataOpt( {
            start: undefined ,
            end: undefined ,
            startValue: start ,
            endValue: end ,
          } );
          this.graphicOptions.instance.setOption( { ...this.graphicOptions.option } );
        } else {
          this.setMinMaxDataZoom();
        }
      }

      if ( this.indiceSelezionato < 0 && this.periodSelected === 'personalized' ) {

        this.echartsOptionsOverView.series.map( ( element: any , i: number , list: Array<any> ) => {
          list[ i ].markArea.data = [];
        } );
        this.echartsOptionsOverView.series[ 0 ].markArea.data = [ newVar ];
        this.echartsOptionsOverView = { ...this.echartsOptionsOverView };
      }

      this.dataService.setTaratura( [] )


      // let {startValue, endValue} = this.graphicOptions.getInstanceZoomData();
      // this.startDatePersonalized = startValue;
      // this.endDatePersonalized = endValue;
      // this.graphicOptions.setZoomData( startValue, endValue );
      // this.echartsOptions = { ...this.graphicOptions.option };
    } , 'primo' );
  }

  setMinMaxDataZoom( value?: { start?: number; end?: number; } ) {
    this.graphicOptions.setZoomData( !value ? this.start: value.start! , !value ? this.end: value.end! );
    this.echartsOptions = { ...this.graphicOptions.option };
  }

  hasDisableNextOrPrev() {
    let personalized = this.periodSelected === 'personalized';
    let full = this.periodSelected === 'full';

    return personalized || full;
  }

  /**
   * @description Metodo che prende le descrizioni per la select di scelta visualizzazione dati dai file di traduzione
   */
  translationOption() {
    this.languageService.currentLanguage$.subscribe( ( language: string ) => {
      this.translateService.getTranslation( language ).subscribe( ( res: any ) => {
        this.choiceModeRender = res.input.select_choice_render;
      } )
    } )
  }

  changeRender( data: any ) {
    console.log( 'render ' + data )
  }

}
