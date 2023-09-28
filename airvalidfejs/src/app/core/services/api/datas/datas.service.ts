/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { forkJoin , map , mergeMap , Observable , of , switchMap , throwError , toArray } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ITimeSelected } from '../../../../shared/components/validazione-dettaglio/models/time-selected.model';
import { IGrafico , ITaratura } from '../../../models/grafico';
import { IParameter } from '../../../models/dataService';
import { addHours , setHours , setMinutes } from 'date-fns';
import { LocalService } from '../../locale/local.service';

interface IValoreModificatoResponse {
  timestamp: number;
  valore_validato: number;
}

@Injectable( {
  providedIn: 'root'
} )
export class DatasService {
  listaParameters: IParameter[] = [];

  constructor( private readonly http: HttpClient, private readonly localService: LocalService ) { }


  // Restituisce le misure presenti nel database per il sensore e il periodo
// specificati
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// {beginDate}: data di inizio del periodo di ricerca delle misure
// "endDate": data di fine del periodo di ricerca delle misure (opzionale)
// "period_m": periodo di aggregazione delle misure (es. 60 minuti); serve per
// non leggere eventuali misure con il timestamp incoerente con il periodo di
// aggregazione e per creare misure fittizie senza valore e con codice dato
// mancante, qualora non fossero presenti una o più misure nel periodo richiesto
// (questo garantisce che il numero di misure ottenuto sia coerente con
// l'ampiezza del periodo richiesto)
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/data/cop/13.001272.803.21/1669762800000?endDate=1669849200000&period_m=60

  getSensorData( key: string , period: number , date?: { start: number | string, end: number | string } ): Observable<ITimeSelected[]> {

    let start = localStorage.getItem( 'startDate' );
    let end = localStorage.getItem( 'endDate' );
    let {date: asDateEnd, utc: utcEnd} = this._getData( +end! );

    end = setMinutes(setHours(new Date(+end!), +utcEnd), 0).getTime().toString();

    if ( date ) {
      // start = addHours( new Date( date.start ) , 1 ).getTime().toString();
      // end = addHours( new Date( date.end ) , 1 ).getTime().toString();
      // start = date.start.toString();
      // end = date.end.toString();
      let {date: asDateStart, utc: utcStart} = this._getData( +date.start );
      let {date: asDateEnd, utc: utcEnd} = this._getData( +date.end );
      start = addHours( asDateStart , +utcStart ).getTime().toString();
      end = addHours( asDateEnd , +utcEnd ).getTime().toString();
    }

    if ( key.includes( "|" ) ) {

      const anno = +key.substring( key.indexOf( "|" ) + 1 , key.length )
      start = ( moment( +start! ).year( anno ).valueOf() ).toString();
      end = ( moment( +end! ).year( anno ).valueOf() ).toString();
      key = key.substring( 0 , key.indexOf( "|" ) )
      console.log( "Anno" , anno )
      console.log( "chiave" , key )
    }

    // nel caso che fosse necessario il giornaliero con il giorno iniziale
    // if ( period === 1440 ) {
    //   start = moment(+start!).startOf('day').utcOffset(2, true).valueOf().toString();
    //   end = moment(+end!).startOf('day').add(1, 'days').utcOffset(2, true).valueOf().toString();
    // }

    //return this.http.get<any>(environment.apiEndpoint+"data/cop/"+key+"/"+start+"?endDate="+end+"&period_m=60");
    return this.http.get<ITimeSelected[]>( environment.apiEndpoint + "data/cop/" + key + "/" + start + "?endDate=" + end + '&period_m=' + period );
  }

  getForkJoinSensorData( event: IParameter[] , lista: ReadonlyArray<Observable<ITimeSelected[]>> ): Observable<IGrafico[]> {
    this.listaParameters = event;
    return forkJoin( lista )
      .pipe(
        switchMap( ( lista ) => lista ) ,
        // concatMap( ( x ) => from( x ) ) ,
        map( ( time , index ) => {
          let datastamps = time.map( value => ( { ...value , timestamp: addHours( new Date( value.timestamp ) , -1 ).valueOf() } ) );

          let data = time.map( value => {
            let {date, utc} = this._getData( value.timestamp );
            return {
              ...value,
              timestamp: addHours( date , -utc ).valueOf()
            }
          })

          return {
            area: event[ index ].area ,
            parametro: event[ index ].parametro ,
            stazione: event[ index ].stazione ,
            visible: event[ index ].visible ,
            visibleOrigin: event[ index ].visibleOrigin ,
            visibleNotValid: event[ index ].visibleNotValid ,
            locked: event[ index ].locked ,
            userLock: event[ index ].userLock ,
            color: event[ index ].color ,
            name: event[ index ].parametro.name + ' - ' + event[ index ].stazione.name ,
            dataset: data ,
            taratura: [],
            key: event[ index ].parametro.key
          };
        } ) ,
        toArray() ,
      );
  }

  private _getData( value: number ) {
    return {
      date: new Date( value ) ,
      utc: new Date( value ).getTimezoneOffset() / -60 === 1 ? 0 : 1,
    }
  }


// Scrive nella banca fati l'elenco delle misure passato come parametro
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/data/cop/13.001272.803.21
  setSensorData( key: string , item: Array<ITimeSelected> ): Observable<number> {
    // item = item.map( value => ( { ...value , timestamp: addHours( new Date( value.timestamp ) , 1 ).valueOf() } ) );
    let data = item.map( value => {
      let {date, utc} = this._getData( value.timestamp );
      return {
        ...value,
        timestamp: addHours( date , utc ).valueOf()
      }
    })
    let body = data.map( ( { changed , ...value } ) => ( { ...value } ) );

    return this.http.put<number>( environment.apiEndpoint + "data/cop/" + key , body );
  }


// Imposta il flag di certificazione per il sensore e il periodo specificati.
// Una volta che il flag di certificazione è impostato, non può essere più
// cancellato usando le API di questo webservice.
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// {beginDate}: data di inizio del periodo di ricerca delle misure
// {endDate}: data di fine del periodo di ricerca delle misure (opzionale)
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/data/certification/cop/13.001272.803.21/1669762800000/1669849200000
  setSensorValidFlag( item: any ): Observable<any> {
    return this.http.put( environment.apiEndpoint + "data/certification/cop/13.001272.803.21/1669762800000/1669849200000" , item );
  }


// Imposta il flag di dato da rivedere per il sensore e il periodo specificati
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// {beginDate}: data di inizio del periodo di ricerca delle misure
// {endDate}: data di fine del periodo di ricerca delle misure
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/data/toreviewflag/cop/13.001272.803.21/1669762800000/1669849200000
  setSensorDataReviewFlag( item: any ): Observable<any> {
    return this.http.put( environment.apiEndpoint + "data/toreviewflag/cop/13.001272.803.21/1669762800000/1669849200000" , item );
  }

  /**
   * @description Restituisce l'elenco delle calibrazioni effettuate sullo strumento che misura
   * il parametro specificato, nel periodo specificato
   * @param {string} key
   * @param {number} start
   * @param {number} end
   * @param {string} type
   * @example
   * https://<server_name>/ariaweb/airvalidsrv/calibrations/${type}/${key}?beginDate=${start}&endDate=${end}
   * @returns {Observable<any>}
   */
  getCalibrations( key: string , start?: number , end?: number , type: string = 'reg' ): Observable<Array<ITaratura>> {
    if ( !start ) {
     start = +this.localService.getItem(this.localService.START_DATE);
    }
    if ( !end ) {
      end = +this.localService.getItem(this.localService.END_DATE);
    }

    return this.http.get<Array<ITaratura>>( environment.apiEndpoint + `calibrations/${ type }/${ key }?beginDate=${ start }&endDate=${ end }` ).pipe(
      mergeMap( ( calibrations ) => {
        if ( !calibrations.length ) {
          return throwError(() => ({message: 'Nessuna taratura disponibile'})  );
        }
        if ( calibrations.length === 1 ) {
          return throwError(() => ({message: 'Una sola taratura disponibile, allungare periodo'})  );
        }
        return of( calibrations );
      } ) ,
    );
  }


  /**
   *  Effettua la correzione delle misure sul periodo specificato, usando le informazioni delle calibrazioni
   *  @param dbId identificatore del data base reg=regionale cop=Arpa per validazione
   *  NOTA: le informazioni relative alle misure vengono lette dal data base specificato, quelle relative alle calibrazioni vengono lette sempre dal data base regionale
   *  @param sensorId identificatore dell'oggetto sensore
   *  @param beginDate data di inizio del periodo di correzione
   *  @param endDate data di fine del periodo di correzione
   *  NOTA: le date di inizio e fine devono essere nello stesso giorno di due calibrazioni distinte e non vi devono essere altre calibrazioni all'interno del periodo specificato
   *  @example
   *  https://<server_name>/ariaweb/airvalidsrv/calibrations/measurecorrection/cop/13.001272.803.21/1669762800000/1669849200000
   */
  setMeasureCorrection( sensorId: string , beginDate: number , endDate: number, dbId: 'reg' | 'cop' = 'reg'  ): Observable<Array<IValoreModificatoResponse>> {
    return this.http.get<Array<IValoreModificatoResponse>>( environment.apiEndpoint + `calibrations/measurecorrection/${dbId}/${ sensorId }/${ beginDate }/${ endDate }`  )
      .pipe(
        switchMap(lista => lista),
        map(item => ({...item, timestamp: addHours(new Date(item.timestamp), -1).valueOf() } )),
        toArray(),
      );
  }


}
