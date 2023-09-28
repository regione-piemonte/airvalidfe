/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject , timer } from 'rxjs';
import { MeasureunitService } from '../api/measureunit/measureunit.service';
import { SettingsService } from '../api/settings/settings.service';
import { IParameter , ObservableData } from '../../models/dataService';
import { Dataset , IGrafico , IOutput , ITaratura } from '../../models/grafico';
import { Interpolation } from '@angular/compiler';
import { ITimeSelected } from '../../../shared/components/validazione-dettaglio/models/time-selected.model';
import { PeriodType } from '../../../shared/components/grafico/compositive_grafic/models';
import { IData , IStatus , Parametri , Selected } from '../../../views/validazione/validazione.component';
import { ColorService } from '../utility/color.service';
import { IDettaglioConfigParam } from '../../models/response/dettaglio-config-param';

@Injectable( {
  providedIn: 'root' ,
} )
export class DataService {
  private toSaveValuesMap = new Map<string , Map<number , any>>();
  private dataSet: Array<IGrafico> = []
  private dataSetFiltered: Array<IGrafico> = []
  private isSaved$ = new BehaviorSubject<boolean>( true );
  isSavedStream$ = this.isSaved$.asObservable()

  private parameter$ = new BehaviorSubject<Partial<ObservableData>>( {} );
  selectedParameter$ = this.parameter$.asObservable();
  private parametersListBus$ = new BehaviorSubject<Partial<IOutput>>( {} );
  parametersList$ = this.parametersListBus$.asObservable();

  private parametersShowNotValidBus$ = new BehaviorSubject<any>( [] );
  parametersListShowNotValid$ = this.parametersShowNotValidBus$.asObservable();

  private reloadParameter$ = new BehaviorSubject<Partial<IOutput>>( {} );
  reloadParameterObs$ = this.reloadParameter$.asObservable();

  private scaleType$ = new BehaviorSubject<string>( '' );
  scaleTypeObs$ = this.scaleType$.asObservable();

  private unitMeasureList: Array<any> = []
  private unitMeasureCodeList: Array<any> = []
  private parametersList?: IOutput;

  private data$ = new BehaviorSubject<IData | null>( null );
  dataObs$ = this.data$.asObservable();

  private taratura$ = new BehaviorSubject<Array<ITaratura> | null>( null );
  taraturaObs$ = this.taratura$.asObservable();


  constructor( private measureUnitService: MeasureunitService ,
               private readonly colorService: ColorService ,
               private settingsService: SettingsService ) {

    this.settingsService.setConfigList().subscribe()
    this.measureUnitService.getMeasureUnitList().subscribe( res => {
      this.unitMeasureList = res
    } )

    this.measureUnitService.getMeasureCodeNameList().subscribe( res => {
      this.unitMeasureCodeList = res
    } )
  }


  setDataset( inputDataSet: Array<IGrafico> ) {
    this.dataSet = inputDataSet
  }

  getDataset() {
    return this.dataSet
  }

  setDatasetFiltered( inputDataSetFiltered: Array<IGrafico> ) {
    this.dataSetFiltered = inputDataSetFiltered
  }

  getDatasetFiltered() {
    return this.dataSetFiltered
  }

  addSaveValue( key: string , value: any ) {


    if ( this.toSaveValuesMap.has( key ) ) {
      this.toSaveValuesMap.get( key )!.set( value.timestamp , value );
    } else {
      let myMap = new Map<number , any>( [ [ value.timestamp , value ] ] );

      this.toSaveValuesMap.set( key , myMap );
    }
    this.isSaved$.next( false )
  }

  clearSaveValue() {
    this.toSaveValuesMap.clear()
    this.isSaved$.next( true )
  }

  getToSaveValue() {
    return this.toSaveValuesMap;
  }

  /**
   * @description Ritorna un boolean per sapere se ci sono dati da salvare
   * @returns boolean
   * @example
   * let isSaved = this.getIsSaved();
   * @returns boolean
   */
  getIsSaved(): boolean {
    return this.toSaveValuesMap.size > 0;
  }

  setSelectedParameter( parameter: ObservableData ) {
    this.parameter$.next( parameter );
  }

  setParametersList( parametersList: IOutput ) {
    // salvo parametro salvato
    this.parametersList = parametersList;
    this.parametersListBus$.next( parametersList );
  }

  /**
   * @description Ritorna il parametro mandato alla tabella di validazione
   * @returns IOutput
   * @example
   * let parametersList = this.getParametersList();
   *
   */
  getParametersList() {
    return this.parametersList;
  }

  setShowNotValidList( parametersListShowNotValid: IParameter ) {
    this.parametersShowNotValidBus$.next( parametersListShowNotValid );
  }


  getUnitMeasure( id: number ) {
    return this.unitMeasureList[ this.unitMeasureList.map( x => x.key ).findIndex( x => x == id ) ]
  }

  getCodeDescription( code: string ) {
    if ( code?.toLowerCase() == 'ok' ) {
      return ''
    }
    return this.unitMeasureCodeList.map( x => x.code ).findIndex( x => x == code ) > -1 ? this.unitMeasureCodeList[ this.unitMeasureCodeList.map( x => x.code ).findIndex( x => x == code ) ].description: ''
  }

  reloadParameter( parameters: Partial<IOutput> ) {
    this.reloadParameter$.next( parameters );
  }

  setScaleType( type: string ) {
    this.scaleType$.next( type );
  }

  /**
   * @description Ritorno delle keys to Map getToSaveValue
   * @returns Array<string>
   */
  getKeysToSaveValue(): IterableIterator<string> {
    return this.toSaveValuesMap.keys();
  }

  /**
   * @description Ritorno del valore della key to Map getToSaveValue
   * @param key
   * @returns Map<number, any>
   *  @example
   *  let map = this.getToSaveValueByKey('key')
   */
  getToSaveValueByKey( key: string ): Map<number , ITimeSelected> {
    return this.toSaveValuesMap.get( key )!;
  }

  /**
   * @description Ricerco indice nella lista dei parametri
   * @param key
   * @returns number
   * @example
   * let index = this.getIndexParameterList('key')
   */
  getIndexParameterList( key: string ): number {
    return this.getDataset().map( ( { parametro } ) => parametro.key ).indexOf( key );
  }

  /**
   * @description Ritorno del dataSet con index
   * @param index
   * @returns IGrafico
   * @example
   * let dataSet = this.getDataSetByIndex(0);
   */
  getDataSetByIndex( index: number ): IGrafico {
    return this.getDataset()[ index ];
  }

  /**
   * @description Settto il valore del grafico con index
   * @param index
   * @param grafico
   * @example
   * this.setDataSetByIndex(0, grafico);
   * @returns void
   */
  setDataSetByIndex( index: number , grafico: IGrafico ): void {
    this.getDataset()[ index ] = grafico;
  }

  /**
   * @description Cerco un grafico dal nome e ritorno il grafico
   * @param name
   * @returns IGrafico
   * @example
   * let grafico = this.getGraficoByName('name');
   *
   */
  getGraficoByName( name: string ): IGrafico | undefined {
    name = name.trimStart();
    name = name.trimEnd();
    return this.getDataset().find( ( { name: nameGrafico } ) => nameGrafico === name );
  }

  /**
   * @description Ritorno l'index del grafico dal nome
   * @param name
   * @returns number
   * @example
   * let index = this.getIndexGraficoByName('name');
   */
  getIndexGraficoByName( name: string ): number {
    return this.getDataset().findIndex( ( { name: nameGrafico } ) => nameGrafico === name );
  }

  /**
   * @description ciclo un Map per ritornare un array di ObservableData
   * @returns Array<ObservableData>
   *   @example
   *   let array = this.getArrayObservableData(map);
   */
  getArrayObservableData() {
    let newdataSet: Dataset[] = [];
    // ciclo le key della map con un for of
    for ( let key of this.getKeysToSaveValue() ) {
      // prendo il valore della key
      let map = this.getToSaveValueByKey( key );
      // ciclo la map con un for of
      for ( let value of map.keys() ) {
        // cerco indice nella lista dei parametri
        let index = this.getIndexParameterList( key );
        // prendo il dataSet con index
        let { dataset , ...grafico } = this.getDataSetByIndex( index );
        // ricerco indice dato il valore del map
        let indexValue = dataset
          .map( ( { timestamp } ) => timestamp )
          .indexOf( map.get( value )!.timestamp );
        // setto il valore del valore dataset changed
        dataset[ indexValue ] = {
          ...dataset[ indexValue ] ,
          ...map.get( value ) ,
        };
        newdataSet = JSON.parse( JSON.stringify( dataset ) );
      }
    }
    return newdataSet;
  }

  /**
   * @description Ritorna un nuovo array con i dati modificati
   *
   */
  getNewArrayDataSet() {
    if ( this.getIsSaved() ) {

    }
  }

  /**
   * @description Ritorna un nuovo array con i dati modificati
   * @param data (array di dati)
   * @param index (index del grafico)
   * @param action (prec, succ)
   * @returns void
   * @example
   * this.setNewArrayDataSet(dataSet, index);
   *
   */
  setNewArrayDataSet( data: Dataset[] , index: number , action?: PeriodType ) {
    let { dataset , ...grafico } = this.getDataSetByIndex( index );

    // cerco il primo valore data ricevuto nel dataset
    let indexStart = dataset.findIndex( ( { timestamp } ) => timestamp === data[ 0 ].timestamp );

    // se trovo il valore lo cancello
    if ( indexStart > -1 ) {
      dataset.splice( indexStart );
    }

    dataset = action === 'succ' ? [ ...dataset , ...data ]: action === 'prec' ? [ ...data , ...dataset ]: dataset;

    this.setDataSetByIndex( index , { dataset , ...grafico } );
  }

  /**
   * @description Ritorna un oggetto con i parametri per il grafico
   * @param count (numero dei parametri)
   * @param selected (oggetto con i parametri selezionati)
   * @param elementParams (oggetto con i parametri)
   * @param status (oggetto con la response del lock)
   * @returns IParameter
   * @example
   * let parameter = this.createParameter(count, selected, elementParams);
   */
  createParameter( count: number , selected: Selected , elementParams: Parametri, status?: IStatus ): IParameter {
    let lock = false;
    if ( status ) {
      lock = status.statusLock.locked && !status.statusLock.myLock
    }
    return {
      color: this.colorService.getColor( count++ ) ,
      visible: true ,
      visibleOrigin: false ,
      visibleNotValid: false ,
      locked: lock ,
      userLock: !!status ? status.statusLock.userInfo : '' ,
      stazione: selected.stazioni.filter( ( { key } ) => ( elementParams.key ).includes( key ) )[ 0 ] ,
      area: selected.areeTerritoriali.filter( ( { key } ) => key == elementParams.key.substring( 0 , elementParams.key.indexOf( '.' ) ) )[ 0 ] ,
      parametro: elementParams ,
    };
  }

  /**
   * @description Riceve un lista di Configurazioni IDettaglioConfigParam e restituisce il result IData
   * @param list (lista di Configurazioni IDettaglioConfigParam)
   * @returns IData
   * @example
   * let data = this.createData(list);
   */
  createData( list: Array<IDettaglioConfigParam> ) {
    let networkNames = list.map( item => item.networkName );
    let stationNames = list.map( item => item.stationName );
    let sensorNames = list.map( item => item.sensorName ) as Parametri[];
    let newMap = new Map( sensorNames?.map( ( el ) => [ el[ 'name' ] , el ] ) ).values();
    let newList = Array.from( newMap );
    return {
      networkNames ,
      stationNames ,
      sensorNames ,
      sensorNamesList: newList
    }
  }

  /**
   * @description Ricevo una lista di IDettaglioConfigParam e restituisco un array di Parametri
   * @param data IData
   * @return void
   */
  setData( data: IData ) {
    this.data$.next( data );
  }

  /**
   * @description Ricievo una lista di Tarature ed emetto il nuovo valore
   * @param taratura Array<ITaratura>
   * @example
   * this.setTaratura(taratura);
   * @returns void
   */
  setTaratura( taratura: Array<ITaratura> ) {
    this.taratura$.next( taratura );
  }


}
