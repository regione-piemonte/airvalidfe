/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Grafic_abstractModel } from './grafic_abstract.model';
import * as moment from 'moment/moment';
import { Dataset , IGrafico , ITaratura } from '../../../../core/models/grafico';
import { ICreateItemData , IDataZoom , IGeneratePoint , IOptionGrafic , IYAxis , PeriodType , ScaleType } from './models';
import { EChartsType } from 'echarts';
import { formatDate } from '@angular/common';
import { differenceInCalendarDays , Interval } from 'date-fns';

export class OptionGraficClass extends Grafic_abstractModel<any> {

  // colori del grafico
  readonly colorValoreNonValidato = '#fbebeb';
  readonly colorBlue = '#008fdc';
  private colorCeleste = '#03b1fc';
  readonly colorBlueScuro = '#000fff';
  readonly colorGreen = '#40D61A';
  readonly colorOrange = '#F17F04';
  readonly colorYellow = '#F7E600';
  readonly colorYellowChiaro = '#fcf6bc';
  readonly coloreValoreFFF = '#9EA2B6';

  lunghezzaPeriodo = 744;


  private _grid = {
    left: '3%' ,
    right: '4%' ,
    bottom: '12%' ,
    top: '3%' ,
    containLabel: true ,
  };

  private _label = {
    backgroundColor: this.colorBlueScuro ,
    color: this.colorYellow ,
    formatter: function( value: any ) {
      return moment( value.value )
        .utcOffset( '+0100' )
      // .format('DD/MM/YYYY HH:mm');
    } ,
  };

  private _tooltip = {
    type: 'line' ,
    trigger: 'item' ,
    axisPointer: {
      label: this._label ,
    } ,
  };
  private _legend = {
    show: false ,
    selected: {}
  };
  private _xAxis = {
    type: 'time' ,
    boundaryGap: false ,
    // splitNumber: 2 ,
    // axisLabel: {
    //   // formatter: function( value: number , index: number ) {
    //   //   let valore = moment( value ).utcOffset( '+0100' );
    //   //   // console.info( 'value & index', {value, index} );
    //   //   // if ( index % 6 ) {
    //   //   //   return valore.format( 'DD/MM')
    //   //   // }
    //   //   if ( index % 6 ) {
    //   //     return valore.format( 'HH:mm' )
    //   //   }
    //   //   return valore.format( 'DD/MMM')
    //   // } ,
    // } ,
  };
  private _yAxis: IYAxis = {
    type: 'value' ,
    axisLabel: { formatter: '{value} ' } ,
  };
  private _toolbox = {
    show: true ,
    feature: {
      dataZoom: {
        yAxisIndex: 'none' ,
      } ,
    } ,
  };
  private _firstDataZoom = {
    realtime: false ,
    filterMode: 'weakFilter' ,
    type: 'slider' ,
    labelFormatter: ( value: number , valueString: string ) => {
      return formatDate( value , 'dd/MMM HH:mm' , 'it'  );
    } ,
    start: 0 ,
    end: 100 ,
    zoomOnMouseWheel: false ,
    moveOnMouseMove: true ,
    moveOnMouseWheel: true , // move up and down with mouse wheel
  };
  private _secondDataZoom = {
    realtime: false ,
    labelFormatter: ( value: number , valueString: string ) => {
      return formatDate( value , 'dd/MMM HH:mm' , 'it'  );
    } ,
  };
  private _visualMap = {
    show: false ,
    dimension: 0 ,
    pieces: [] ,
  };
  private _graphic = {
    type: 'line' ,
    progressive: true ,
  };
  public option: IOptionGrafic = {
    legend: this._legend ,
    tooltip: this._tooltip ,
    grid: this._grid ,
    useUTC: false ,
    xAxis: this._xAxis ,
    yAxis: this._yAxis ,
    // legend: legend ,
    toolbox: this._toolbox ,
    graphic: this._graphic ,
    dataZoom: [
      this._firstDataZoom ,
      this._secondDataZoom ,
    ] ,
    visualMap: this._visualMap ,
    series: [] ,
  };
  public optionOver: IOptionGrafic = {
    ...this.returnClone( this.option ) ,
    dataZoom: []
  };
  public scaleType: ScaleType = 'assoluta';
  instance!: EChartsType;
  grafici: Array<IGrafico> = [];


  /**
   * @description Ritorna le serie dell'oggetto instance di echarts o dell'oggetto option, nel caso in cui non sia stata settata l'istanza
   * @returns {Partial<ICreateItemData<any>>[]}
   * @example
   * let series = getSeries();
   */
  override getSeries(): Partial<ICreateItemData<any>>[] {
    if ( this.instance ) {
      return this.instance.getOption()[ 'series' ] as Partial<ICreateItemData<any>>[];
    }
    return this.returnOption().series;
  }

  /**
   * @description Ritorna le serie dell'oggetto optionOver
   */
  getSeriesOver(): Partial<ICreateItemData<any>>[] {
    return this.returnClone( this.optionOver.series );
  }

  override setSeries( series: Partial<ICreateItemData<any>>[] ): void {
    this.option.series = series;
  }

  override getSerie( index: number ): Partial<ICreateItemData<any>> {
    return this.getSeries()[ index ];
  }

  override setSerie( index: number , serie: Partial<ICreateItemData<any>> ) {
    this.option.series[ index ] = this.returnClone( serie );
    if ( this.instance ) {
      this.instance.setOption( { ...this.option } );
    }
  }

  setSerieOver( index: number , serie: any ) {
    this.optionOver.series[ index ] = this.returnClone( serie );
  }

  override resetSeries( i: number ) {
    this.option.series.forEach( ( serie: any , index: number ) => {
      if ( index !== i ) {
        serie.markArea = {
          ...serie.markArea ,
          data: [] ,
        }
      }
    } );
  }

  /**
   * @description Ritorna una copia dell'oggetto option
   * @param {{overView: boolean}} opt
   * @returns {IOptionGrafic}
   */
  returnOption( opt?: { overView?: boolean } ): IOptionGrafic {
    return this.returnClone( opt?.overView ? this.optionOver: this.option );
  }

  returnClone<T>( input: T ): T {
    return JSON.parse( JSON.stringify( input ) );
  }

  setOption( option: IOptionGrafic ): void {
    this.option = option;
  }

  createSeries( grafici: ReadonlyArray<IGrafico> ): void {
    let serie = this.returnClone( grafici.map( grafico => this._createSerie<any>( grafico , grafico.color , false , false ) ) );
    let serieOrigin = this.returnClone( grafici.map( grafico => this.createItemData( grafico ) ) );
    // this.option.series = [...serie, ...serieOrigin];
    this.series = [ ...serie , ...serieOrigin ];
    let names = this.series.map<{ name: string, visible: boolean }>( ( item , index ) => ( { name: item.name , visible: !item.name.endsWith( 'origin' ) ? grafici[ index ].visible: false } ) );
    let recordObj: Record<string , boolean> = {};
    names.forEach( ( { name , visible } ) => recordObj[ name ] = visible );
    this.option.legend!.selected = { ...recordObj };
    this.option.series = [ ...serie , ...serieOrigin ];
    this.createSeriesOver( grafici );
    this.grafici = [...grafici];
  }

  addSerieWithListGrafic( grafici: ReadonlyArray<IGrafico> , action?: PeriodType ): void {
    let points = grafici.map( ( { dataset } ) => dataset.map( ( item ) => this.generatePoint( item , 1 , 1 , true , false ) ) );
    let originPoints = grafici.map( ( { dataset } ) => dataset.map( ( { timestamp , valore_originale } ) => ( [ timestamp , valore_originale ] as [ number , number ] ) ) );
    let length = this.option.series.length;
    points.forEach( ( point , index ) => {
      let name = grafici[index].name;
      let indexSerie = this.findIndexToName( name );
      let indexSerieOrigin = this.findIndexToName( name , { origin: true } );
      let first = point[ 0 ].value![ 0 ];
      let findIndex = ( this.getSerie( indexSerie ).data as Partial<IGeneratePoint>[] )?.findIndex( ( { value } ) => value![ 0 ] === first );
      let findIndexOrigin = ( this.getSerie( indexSerieOrigin ).data as [ number , number ][] )?.findIndex( ( [ time , value ] ) => time === first );
      if ( findIndex > -1 ) {
        this.option.series[ indexSerie ].data?.splice( findIndex-- );
        this.optionOver.series[ index ].data?.splice( findIndex-- );
      }
      if ( findIndexOrigin > -1 ) {
        this.option.series[ indexSerieOrigin].data?.splice( findIndexOrigin-- );
      }
      if ( action === 'prec' ) {
        ( this.option.series[ indexSerie ].data as Partial<IGeneratePoint>[] ).unshift( ...point );
        ( this.option.series[ indexSerieOrigin ].data as [ number , number ][] ).unshift( ...originPoints[ index ] );
        ( this.optionOver.series[ index ].data as Partial<IGeneratePoint>[] )?.unshift( ...point );
      }
      if ( action === 'succ' ) {
        // aggiungo elementi alla serie
        ( this.option.series[ indexSerie ].data as Partial<IGeneratePoint>[] )?.push( ...point );
        ( this.option.series[ indexSerieOrigin ].data as [ number , number ][] )?.push( ...originPoints[ index ] );
        ( this.optionOver.series[ index ].data as Partial<IGeneratePoint>[] )?.push( ...point );
      }

      this.instance.setOption({...this.option})

    } );
  }

  createItemData( elementDataseInput: IGrafico , dataOrigin?: Array<Array<IGeneratePoint>> , index?: number ): Partial<ICreateItemData<any>> {
    return {
      name: elementDataseInput.name + ' - origin' ,
      type: 'line' ,
      //symbol: 'none',
      sampling: 'average' ,
      showSymbol: false ,
      animation: false ,
      lineStyle: {
        color: elementDataseInput.color ,
        //width: 1 ,
        type: 'dashed' ,
      } ,
      itemStyle: {
        color: elementDataseInput.color ,
      } ,

      data: elementDataseInput.dataset.map( ( { timestamp , valore_originale } ) => ( [ timestamp , valore_originale ] as [ number , number ] ) ) ,
      markArea: {
        itemStyle: {
          // color: 'rgba(255, 173, 177, 0.2)'
        } ,
        data: [] ,
      } ,
    };
  }

  private _createSerie<T>( item: IGrafico , color?: string , primoSep: boolean = false , datiVisibili = false ): ICreateItemData<T> {

    return {
      id: Math.random() * 100 ,
      xAxisIndex: 0 ,
      yAxisIndex: 0 ,
      name: item.name ,
      type: 'line' ,
      symbol: 'none' ,
      showSymbol: false ,
      symbolSize: this.getSizeToPeriodo(item.dataset.length) ,
      smooth: false ,
      animation: false ,
      lineStyle: {
        width: item.parametro.key.includes( '|' ) ? 2 : 1.5 ,
        color ,
        type: item.parametro.key.includes( '|' ) ? 'dotted': 'line' ,
      } ,
      markArea: {
        data: primoSep ? [
          [ { xAxis: 0 } , {} ]
        ]: [] ,
        itemStyle: {
          opacity: 0.3 ,
          //color: this.colorYellowChiaro
        },
        emphasis : {
          disabled: true ,
        }
      } ,
      data: item.dataset.map( item => this.generatePoint( item , 1 , 1 , datiVisibili , false ) ) ,
      markLine: {
        symbol: [ 'none' , 'arrow' ] ,
        label: { show: false } ,
        data: []
      }
    }
  }

  createMarkLine( data: IGrafico ) {
    return data.taratura?.map(tar => ({xAxis: tar.beginDate})) ?? [];
  }

  createSeriesOver( grafici: ReadonlyArray<IGrafico> ): void {
    let serie = this.returnClone( grafici.map( grafico => this._createSerie<any>( grafico , grafico.color , false , false ) ) );
    serie = this.returnClone( serie.map( item => ( {
      ...item ,
      showSymbol: false ,
      markArea: {
        itemStyle: {
          opacity: 0.3 ,
          color: this.colorYellowChiaro
        } ,
        data: this.createMarkArea( grafici[ 0 ].dataset ),
      },
    } ) ) );
    this.optionOver.series = [ ...serie ];
  }

  generatePoint( { verification_flag , flag_validaz_autom , validity_flag , ...input }: Dataset , min?: number , max?: number , notValidDataVisible: boolean = false , isOrigin: boolean = false ): Partial<IGeneratePoint> {
    let color = '#000';
    let symbol = '';

    // console.log('generate point', input);
    // console.log('generate point notValidDataVisible', notValidDataVisible);

    switch (verification_flag) {
      case 3:
        color = +flag_validaz_autom === 0 ? this.colorCeleste: this.colorBlue;
        symbol = +flag_validaz_autom === 0 ? 'circle': 'square';
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
          case 3:
            color = this.colorGreen;
            symbol = 'triangle';
            break;
          case -99:
          case -1:
            color = validity_flag === -99 ? this.colorOrange: 'red';
            symbol = 'square';
            break;
        }
        break;
    }

    //console.log('this.periodSelected', this.periodSelected);
    let point: Partial<IGeneratePoint> = {
      value: this.checkValue( { verification_flag , flag_validaz_autom , validity_flag , ...input } , min , max , notValidDataVisible , isOrigin ) , //min && max?(input.valore_validato-min)*100/max:input.valore_validato,
      itemStyle: {} ,
      symbol: symbol ,
      // symbolSize: 10 , //+this.periodSelected==1|| +this.periodSelected==3 ? 5 : 10,
      show: verification_flag != 2 ,
      point_dataset: { verification_flag , flag_validaz_autom , validity_flag , ...input } ,
    };

    //if (input.verification_flag == 3 || input.verification_flag == 2) {
    point.itemStyle = {
      color: color ,
      // opacity:input.verification_flag == 2? 0 : 1,
      show: verification_flag != 2 ,
    };

    if ( validity_flag === 3 ) {
      point.itemStyle = {
        borderWidth: 3 ,
        borderColor: this.colorGreen ,
        color: 'transparent' ,
      };
    }

    if ( validity_flag == 2 ) {
      point.symbolSize = 16;
    }

    if ( input.tipologia_validaz == 'FFF' ) {

      point.itemStyle = {
        color: this.coloreValoreFFF ,
      }
      point.symbol = 'circle'
    }
    //}
    return point;
  }

  checkValue( { timestamp , validity_flag , verification_flag , valore_validato , valore_originale }: Dataset , min: number = 1 , max: number = 1 , notValidDataVisible: boolean = false , isOrigin: boolean = false ) {
    let verificaValidityDataVisibile = verification_flag === 2 && validity_flag < 0 && !notValidDataVisible;
    let validityDataVisibileVerifica = verification_flag === 1 && validity_flag < 0 && notValidDataVisible;
    if ( verificaValidityDataVisibile ) {
      return [ timestamp , '' ];
    } else {
      if ( validityDataVisibileVerifica ) {
        return [ timestamp , '' ];
      } else {
        if ( isOrigin ) {
          return this.scaleType === 'relativa'
            ? [ timestamp , ( ( ( valore_originale - min ) * 100 ) / ( max - min ) ) ]
            : [ timestamp , valore_originale ];
        } else {
          return this.scaleType === 'relativa'
            ? [ timestamp , ( ( ( valore_validato - min ) * 100 ) / ( max - min ) ) ]
            : [ timestamp , valore_validato ];
        }
      }
    }
  }

  createMarkArea( input: Dataset[] ) {
    let startMark = input[ 0 ].timestamp;
    let endMark = input[ input.length - 1 ].timestamp;
    return [ [ { xAxis: startMark } , { xAxis: endMark } ] ];
  }

  /**
   * @description Setta i valori di start & end dell'oggetto dataZoom
   * @param {number} start
   * @param {number} end
   * @returns {void}
   * @example
   * setZoomData(0, 100)
   */
  setZoomData( start: number , end: number ): void {
    this.option.dataZoom![ 0 ] = {
      ...this.option.dataZoom![ 0 ] ,
      start ,
      end ,
    }
  }

  /**
   * @description Ritorna il valore della proprietà dataZoom
   * @returns {IDataZoom}
   * @example
   * let zoom = getZoomData();
   */
  getZoomData(): Partial<IDataZoom> {
    return this.option.dataZoom![ 0 ]
  }

  /**
   * @description Ritorna il valore della proprietà dataZoom della instance di echarts, il primo elemento dell'array
   * @returns {IDataZoom}
   * @example
   * let zoom = getInstanceZoomData();
   */
  getInstanceZoomData(): IDataZoom {
    let [ primo ] = this.instance.getOption()[ 'dataZoom' ] as IDataZoom[];
    return primo;
  }

  /**
   * @description Setta i valori dell'oggetto dataZoom
   * @param {Partial<IDataZoom>} value
   * @returns {void}
   * @example
   * setZoomDataOpt({startValue: 0, endValue: 100})
   */
  setZoomDataOpt( value: Partial<IDataZoom> ): void {
    this.option.dataZoom![ 0 ] = {
      ...this.option.dataZoom![ 0 ] ,
      ...value ,
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
  setSymbolShow( index: number , value: boolean ): void {
    this.option.series[ index ].showSymbol = value;
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
  setSymbolSize( index: number , value: number ): void {
    this.option.series[ index ].symbolSize = value;
    this.instance.setOption( { ...this.option });
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
  setSymbolWithSeries( series: Partial<ICreateItemData<any>>[] , index: number , { show, size, periodo }: Partial<{ show: boolean, size: number, periodo: number }> ): void {
    //series[ index ].showSymbol = value;
    show = periodo &&  periodo <= this.lunghezzaPeriodo || false;
    let sizeSymbol = periodo && periodo >=24 && periodo <= this.lunghezzaPeriodo ? this.getSizeToPeriodo(periodo) : !!size ? size  : 10;
    series[ index ] = {
      ...series[ index ] ,
      showSymbol: show ,
      symbolSize: sizeSymbol ,
    }
  }

  getSizeToPeriodo( periodo: number ): number {
    switch (true) {
      case periodo && periodo >= 48 && periodo < 72: return 10;
      case periodo && periodo >= 72 && periodo < 96: return 9;
      case periodo && periodo >= 96 && periodo < 144: return 8;
      case periodo && periodo >= 144 && periodo < 266: return 6;
      case periodo && periodo >= 266 && periodo < 745: return 4;
      default: return 10;
    }
  }

  operation(): string {
    return '';
  }

  resetShowAll(): Partial<ICreateItemData<any>>[] {
    return this.option.series.map( serie => {
      return {
        ...serie ,
        showSymbol: false ,
        lineStyle: {
          ...serie.lineStyle ,
          width: 1.5 ,
        }
      };
    } );
  }

  serColorItemStyle( indice: number , rga: string ) {
    this.option.series[ indice ].markArea!.itemStyle = {
      ...this.option.series[ indice ].markArea?.itemStyle ,
      color: rga ,
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
  getDataOfSerie( index: number ): Partial<IGeneratePoint>[] {
    return this.option.series[ index ].data as Partial<IGeneratePoint>[];
  }

  /**
   * @description Setta il valore della istanza di echarts
   * @param ec {EChartsType}
   * @return void
   * @example
   * graphicOptions.setInstance(ec);
   */
  setInstance( ec: EChartsType ): void {
    this.instance = ec;
  }

  setSeriesOver( seriesOver: Partial<ICreateItemData<any>>[] ) {
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
  findIndexToName( name: string , opt?: Partial<{ origin: boolean; overView: boolean }> ): number {
    if ( opt?.origin ) {
      name = name.concat( ' - origin' );
    }
    let lista = opt?.overView ? this.getSeriesOver(): this.option.series;
    return lista.findIndex( ( { name: nameOrig } ) => nameOrig === name );
  }

  /**
   * @description Rimuovo la serie tramite un l'indice e la posiziono in prima posizione
   * @param index {number}
   * @param series {Array<T>}
   * @return void
   * @example
   * graphicOptions.removeAndMoveSeriesToIndex(0);
   */
  removeAndMoveSeriesToIndex<T>( index: number , series: Array<Partial<ICreateItemData<any>>> ): Array<Partial<ICreateItemData<any>>> {
    let temp = series.splice( index , 1 )[ 0 ];
    series.unshift( temp );
    return series;
  }

  /**
   * @description Ritorna il nome della serie tramite l'indice
   * @param index {number}
   * @return string
   * @example
   * let name = graphicOptions.getNameSerie(0);
   */
  getNameSerie( index: number ): string {
    return this.getSerie( index )?.name ?? '';
  }

  /**
   * @description Elimina la serie tramite l'indice
   * @param index {number}
   * @param opt {{overView: boolean}}
   * @return void
   * @example
   * graphicOptions.removeSerie(0);
   */
  override removeSerie( index: number , opt?: { overView: boolean } ): void {
    let lista = opt?.overView ? this.optionOver: this.option;
    lista.series.splice( index , 1 );
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
  findIndexToValue( indice: number , time: string | number , opt?: { overView: boolean } ): number {
    let lista = opt?.overView ? this.optionOver: this.option;
    let listaPoint = lista.series[ indice ].data as Partial<IGeneratePoint>[] ?? [];
    return listaPoint.findIndex( ( { value } ) => value![ 0 ] === time );
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
  setColorSeries( index: number , color: string ): void {
    let serie = this.getSerie( index );
    let seriesOverElement = this.getSeriesOver()[ index ];
    serie.itemStyle = {
      ...serie.itemStyle ,
      color ,
    }
    serie.lineStyle = {
      ...serie.lineStyle ,
      color ,
    }
    seriesOverElement.itemStyle = {
      ...seriesOverElement.itemStyle ,
      color ,
    }
    seriesOverElement.lineStyle = {
      ...seriesOverElement.lineStyle ,
      color ,
    }

    this.setSerie( index , serie );
    this.setSerieOver( index , seriesOverElement );
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
  viewPallini( index: number | null , name?: string , value: number = 0 ): void {
    let indexSerie = null;
    if ( index != null ) { indexSerie = index; } else { indexSerie = this.findIndexToName( name ?? '' ); }


    this.setSymbolShow( indexSerie , value <= this.lunghezzaPeriodo );
    this.setSymbolSize( indexSerie , this.getSizeToPeriodo(value) );
  }

  /**
   * @description Setta il valore dell'oggetto xAxis
   * @param yAxis {Partial<IYAxis>}
   * @return void
   * @example
   * graphicOptions.setXAxis({type: 'category', data: ['2019-01-01', '2019-01-02', '2019-01-03']});
   * graphicOptions.setXAxis({min: 0, max: 100});
   */
  setYAxis( yAxis: Partial<IYAxis> ) {
    this.option.yAxis = {
      ...this.option.yAxis ,
      ...yAxis ,
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
  getMinMaxYAxis( indice: number , opt?: { overView: boolean } ): { min: number, max: number } {
    let listaPointValue = this.extractedLista( indice , opt );
    let listaPointNumber: Array<number> = [];

    if ( 'value' in listaPointValue[ 0 ] ) {
      listaPointNumber = ( listaPointValue as Partial<IGeneratePoint>[] ).map( ( { value } ) => value![ 1 ] );
    } else {
      listaPointNumber = ( listaPointValue as [ number , number ][] ).map( ( [ , value ] ) => value );
    }

    return {
      min: Math.min( ...listaPointNumber ) ,
      max: Math.max( ...listaPointNumber ) ,
    }
  }

  /**
   * @description Calcola il valore massimo e minimo della data
   * @param data {Partial<IGeneratePoint>[] | [number, number][]}
   * @return {min: number, max: number} 'ritorna il valore massimo e minimo'
   * @example
   * let {min, max} = graphicOptions.getMinMaxToData(data);
   * @output
   * {min: number, max: number}
   */
  getMaxMinToData( data: Partial<IGeneratePoint>[] | [ number , number ][] ): { min: number, max: number } {
    let listaPointNumber: Array<number> = [];
    if ( 'value' in data[ 0 ] ) {
      listaPointNumber = ( data as Partial<IGeneratePoint>[] ).map( ( { value } ) => value![ 1 ] );
    } else {
      listaPointNumber = ( data as [ number , number ][] ).map( ( [ , value ] ) => value );
    }

    return {
      min: Math.min( ...listaPointNumber ) ,
      max: Math.max( ...listaPointNumber ) ,
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
  private extractedLista( indice: number , opt?: { overView: boolean | undefined } ) {
    let lista = opt?.overView ? this.optionOver: this.option;
    let listaPoint: Partial<IGeneratePoint>[] | [ number , number ][] = [];
    // verifico se la serie non ha origin nel nome
    if ( lista.series[ indice ].name!.includes( 'origin' ) ) {
      listaPoint = lista.series[ indice ].data as [ number , number ][] ?? [];
    } else {
      listaPoint = lista.series[ indice ].data as Partial<IGeneratePoint>[] ?? [];
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
  getSumSerie( indice: number , opt?: { overView: boolean } ): { lunghezza: number, tot: number } {
    let listaPointValue = this.extractedLista( indice , opt );

    let listaPointNumber: Array<number> = [];

    if ( 'value' in listaPointValue[ 0 ] ) {
      listaPointNumber = ( listaPointValue as Partial<IGeneratePoint>[] ).map( ( { value } ) => value![ 1 ] );
    } else {
      listaPointNumber = ( listaPointValue as [ number , number ][] ).map( ( [ , value ] ) => value );
    }

    let tot = listaPointNumber.reduce( ( a , b ) => a + b , 0 );
    return {
      lunghezza: listaPointValue.length ,
      tot ,
    }
  }

  /**
   * @description Ritorna il valore massimo e minimo dell'assi x
   * @return Record<string, {min: number, max: number}>
   * @example
   * let {nomeSerie} = graphicOptions.getAllMinMaxXAxis();
   * let {nomeSerie} = graphicOptions.getAllMinMaxXAxis({overView: true});
   */
  getAllMinMaxYAxis( opt?: { overView: boolean } ): Record<string , { min: number, max: number }> {
    this.setLabelYAxis( true );
    let lista = opt?.overView ? this.optionOver: this.option;
    let listaMinMax: Record<string , { min: number, max: number }> = {};
    lista.series.forEach( ( { name , data } , index , serie ) => {
      let { min , max } = this.getMaxMinToData( data! );
      serie[ index ].dataAfterRelativa = this.returnClone( data! );
      if ( 'value' in data![ 0 ] ) {
        serie[ index ].data = ( data as Partial<IGeneratePoint>[] ).map( ( { value , ...item } ) => ( {
          ...item ,
          value: [ value![ 0 ] , this.getPercentValue( value![ 1 ] , { min , max } ) ]
        } ) );
      } else {
        serie[ index ].data = ( data as [ number , number ][] ).map( ( [ time , value ] ) => ( [ time , this.getPercentValue( value , { min , max } ) ] ) as [ number , number ] );
      }
    } );
    console.table( this.option.series );
    this.instance.setOption( { ...this.option } );
    return listaMinMax;
  }

  setLabelYAxis( relativa: boolean = false ) {
    this.option.yAxis.axisLabel.formatter = relativa ? '{value} %': '{value}';
  }


  /**
   * @description Riporto i dati originali
   *
   */
  restoreData() {
    this.setLabelYAxis();
    this.option.series.forEach( ( { data , dataAfterRelativa } , index , serie ) => {
      serie[ index ].data = dataAfterRelativa ? dataAfterRelativa: data;
    } );
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
  getAllSumSerie( opt?: { overView: boolean } ): Record<string , { lunghezza: number, tot: number }> {
    let lista = opt?.overView ? this.optionOver: this.option;
    let listaSum: Record<string , { lunghezza: number, tot: number }> = {};
    lista.series.forEach( ( { name } , index ) => {
      listaSum[ name! ] = this.getSumSerie( index , opt );
    } );
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
  getPercentValue( value: number , { min , max }: { max: number, min: number } ): number {

    return Math.round( ( value - min ) / ( max - min ) * 100 );
  }

  getDays(): number {
    let {options, series} = this.instance.getOption();
    let serieData = series as Partial<ICreateItemData<any>>[];
    let first = serieData[0].data![0];
    let last = serieData[0].data![serieData[0].data!.length - 1];
    if ( 'value' in first && 'value' in last) {
      let firstValue = first.value![0];
      let lastValue = (last).value![0];
      return differenceInCalendarDays(  lastValue, firstValue );
    }

    return differenceInCalendarDays(last as [number, number][0], first as [number, number][0] );
  }

  getDaysToData( start: string, end: string ): number {
    let startTime = new Date(start).getTime();
    let endTime = new Date(end).getTime();
    return differenceInCalendarDays( endTime, startTime );
  }

  getGrafici() {
    return this.grafici;
  }

  getGraficoToName( name: string ) {
    return this.grafici.find( grafico => grafico.name === name );
  }

  getTaraturaToName( name: string ) {
    return this.grafici.find( grafico => grafico.name === name )?.taratura;
  }

  createTaratura( taratura: ITaratura[] ) {
    return taratura.map( tar => ( {xAxis: tar.beginDate}) );
  }


}
