/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MeasureunitService , SettingsService } from '../api';
import { IParameter , ObservableData } from '@models/dataService';
import { Dataset , IGrafico , IOutput , ITaratura } from '@models/grafico';
import { ITimeSelected } from '@components/shared/validazione-dettaglio/models/time-selected.model';
import { PeriodType } from '@components/shared/grafico/compositive_grafic/models';
import { ColorService } from '../utility/color.service';
import { IDettaglioConfigParam } from '@models/response/dettaglio-config-param';
import { Store } from '@ngrx/store';
import { AppState } from '../../../state';
import { setDataSet } from '@actions/*';
import {IData, IStatus, Parametri, Selected} from "@models/validazione";


export interface IResponseMeasureList {
  name:      string;
  key:       string;
  active:    boolean;
  extraInfo: null | string;
  flags:     null;
}


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

  private reloadParameter$ = new BehaviorSubject<Partial<IOutput>>( {} );
  reloadParameterObs$ = this.reloadParameter$.asObservable();


  private unitMeasureList: Array<IResponseMeasureList> = []
  private unitMeasureCodeList: Array<any> = []
  private parametersList?: IOutput;

  private data$ = new BehaviorSubject<IData | null>(null);
  dataObs$ = this.data$.asObservable();

  private taratura$ = new BehaviorSubject<Array<ITaratura> | null>( null );
  taraturaObs$ = this.taratura$.asObservable();

  private resetParametroSelezionato = new BehaviorSubject<boolean>(false);
  resetParametroSelezionato$ = this.resetParametroSelezionato.asObservable();


  constructor( private measureUnitService: MeasureunitService ,
               private readonly colorService: ColorService ,
               private settingsService: SettingsService,
               private readonly storeService: Store<AppState> ,
               ) {

    this.settingsService.setConfigList().subscribe()
    this.measureUnitService.getMeasureUnitList().subscribe( res => {
      this.unitMeasureList = res
    } )

    this.measureUnitService.getMeasureCodeNameList().subscribe( res => {
      this.unitMeasureCodeList = res
    } )
  }


  /**
   * @description Setto lista Grafici memorizzati
   * @param inputDataSet Array<IGrafico>
   * @example
   * this.setDataset(dataSet);
   */
  setDataset( inputDataSet: Array<IGrafico> ) {
    this.storeService.dispatch(setDataSet( inputDataSet ));
    this.dataSet = inputDataSet;
  }

  /**
   * @description Ritorna lista Grafici memorizzati
   * @returns Array<IGrafico>
   * @example
   * let dataSet = this.getDataset();
   */
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

  /**
   * @description Pulisce il valore del Map
   * Emette il valore true per dire che non ci sono dati da salvare
   */
  clearSaveValue() {
    this.toSaveValuesMap.clear();
    this.isSaved$.next( true )
  }

  /**
  * @description Pulisco il valore del Map
  */
  clearAllValue() {
    this.toSaveValuesMap.clear();
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

  resetSelectedParameter() {
    this.resetParametroSelezionato.next(true)
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


  /**
   * Retrieves the unit measure object with the given ID from the unitMeasureList.
   *
   * @param {number} id - The ID of the unit measure to retrieve.
   * @returns {IResponseMeasureList} The unit measure object with the given ID, or undefined if it does not exist.
   * @example
   * let result = this.getUnitMeasure(23)
   */
  getUnitMeasure( id: number ): IResponseMeasureList {
    if (!this.unitMeasureList || !this.unitMeasureList.length) {
      throw new Error('Lista non presente');
    }
    return this.unitMeasureList[ this.unitMeasureList.map( ({key}) => key ).findIndex( key => +key === id ) ];
  }

  getCodeDescription( code: string ) {
    if ( code?.toLowerCase() == 'ok' ) {
      return ''
    }
    return this.unitMeasureCodeList.map( x => x.code ).findIndex( x => x == code ) > -1 ? this.unitMeasureCodeList[ this.unitMeasureCodeList.map( x => x.code ).findIndex( x => x == code ) ].description: ''
  }

  reloadParameter( parameters: Partial<IOutput> ) {
    this.reloadParameter$.next( parameters );
    this.taratura$.next([]);
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
   * @description Ritorno del dataSet specifico dal grafico con index passato
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
    // ricostruisco lista dei grafici con il nuovo grafico
    let iGraficos = this.getDataset().map( ( item, i)  => i == index ? grafico : item);
    // setto la lista dei grafici
    this.setDataset( iGraficos );
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
        // dataset[ indexValue ] = {
        //   ...dataset[ indexValue ] ,
        //   ...map.get( value ) ,
        // };
        const newDataSet = {
          ...dataset[ indexValue ] ,
          ...map.get( value ) ,
        }
        if ( !newdataSet.length ) {
          newdataSet = [ ...dataset.slice( 0 , indexValue ) , newDataSet , ...dataset.slice( indexValue + 1 ) ];
        } else {
          newdataSet = [ ...newdataSet.slice( 0 , indexValue ) , newDataSet , ...newdataSet.slice( indexValue + 1 ) ];
        }
        // newdataSet = JSON.parse( JSON.stringify( dataset ) );
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
   * @description Riceve una lista di dati e aggiorna il grafico, l'action può essere prec o succ
   * @param data Array<Dataset>
   * @param index number - index del grafico
   * @param action PeriodType - tipo di azione
   * @returns void
   * @example
   * this.setNewArrayDataSet(dataSet, index);
   */
  setNewArrayDataSet( data: Dataset[] , index: number , action?: PeriodType ) {
    let { dataset , ...grafico } = this.getDataSetByIndex( index );

    // cerco il primo valore data ricevuto nel dataset
    let indexStart = dataset.findIndex( ( { timestamp } ) => timestamp === data[ 0 ].timestamp );

    // se trovo il valore lo cancello
    if ( indexStart > -1 ) {
      dataset.splice( indexStart );
    }

    dataset = action === 'succ' ? [ ...dataset , ...data ] : action === 'prec' ? [ ...data , ...dataset ]: dataset;

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
  * @description Riceve una lista T è restituisce una lista di elementi unici
   * @param list (lista di elementi generici)
   * @param key (lista di chiavi per filtrare la lista)
   * @returns Array<T>
  */
  getUniqueList<T, K extends keyof T>( list: Array<T> , key: K): Array<T> {
    let uniqueKeys = [...new Set(list.map(item => item[key]))];
    let uniqueArray = uniqueKeys.map(keyArray => list.find(item => item[key] === keyArray));
    return uniqueArray as Array<T>;
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

  /**
   * @description Elimino il valore del grafico dal dataset
   * @param value { index?: number; name?: string }
   * @example
   * this.deleteDataSetByIndex(index);
   * @returns void
   */
  deleteDataSetByIndex( value: { index?: number; name?: string; origin?: boolean} ) {
    if ( value.origin && value.name) {
      value.name = value.name! + ' - origin';
    }
    let index = value.index ? value.index : this.getIndexGraficoByName( value.name! );
    this.dataSet = this.dataSet.filter( ( item, i ) => i !== index );
  }


}
