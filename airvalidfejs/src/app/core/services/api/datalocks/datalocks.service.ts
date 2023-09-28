/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IGetStatusLock } from '../../../../shared/models/interface/BE/response/getLock';

type UserStateLock = 'cop' | 'reg';

@Injectable( {
  providedIn: 'root'
} )
export class DatalocksService {

  constructor( private readonly http: HttpClient ) {}


// Restituisce lo stato del lock per un dato sensore
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/datalock/cop/13.001272.803.21
  getSensorStateLock( key: string ): Observable<IGetStatusLock> {
    let anno = moment( +localStorage.getItem( 'startDate' )! )
      .utcOffset( '+0100' )
      .format( 'YYYY' )
    return this.http.get<IGetStatusLock>( environment.apiEndpoint + "datalock/cop/" + key + '/' + anno );
  }


// Cerca di ottenere il lock per un dato sensore
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/datalock/cop/13.001272.803.21
  setSensorStateLock( key: string , item: Partial<IGetStatusLock> , dbId: UserStateLock = 'cop'): Observable<IGetStatusLock> {
    let anno = moment( +localStorage.getItem( 'startDate' )! )
      .utcOffset( '+0100' )
      .format( 'YYYY' );
    item.year = +anno;
    return this.http.put<IGetStatusLock>( environment.apiEndpoint + `datalock/${dbId}/${key}/${anno}`, item );
  }


  /**
   * @description Rilascia tutti i lock appartenenti all'utente
   * @params {dbId} dbId: identificatore del data base reg=regionale cop=Arpa per validazione
   * Esempio: https://<server_name>/ariaweb/airvalidsrv/datalock/cop
   */
  deleteUserStateLock( dbId: UserStateLock = 'cop' ): Observable<any> {
    return this.http.delete<any>( environment.apiEndpoint + `datalock/${ dbId }` );
  }


  /** @description Rilascia il lock per un dato sensore
   * @params {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
   * @params {sensorId}: identificatore dell'oggetto sensore
   * @params {anno}: anno di riferimento
   * @example
   * https://<server_name>/ariaweb/airvalidsrv/datalock/cop/13.001272.803.21
   */
  deleteSensorStateLock(  sensorId: string , anno: number | string, dbId: UserStateLock = 'cop', ): Observable<any> {
    return this.http.delete<any>( environment.apiEndpoint + `datalock/${ dbId }/${ sensorId }/${ anno }` );
  }


}
