/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {EMPTY, forkJoin, interval, map, Observable, of, Subject, switchMap, takeUntil} from 'rxjs';
import {environment} from '@environments/environment';
import {IGetStatusLock, IResponseLock, IResponseLockWithName} from '@models/interface/BE/response/getLock';
import {IParameter, Parametro} from "@models/dataService";
import {format, isValid, subYears} from "date-fns";
import {PollingLockService} from "@components/shared/validazione-parametri/services/polling-lock.service";
import {Store} from "@ngrx/store";
import {AppState} from "../../../../state";
import {LocalService} from "@services/core/locale/local.service";
import {DateSettingService} from "@services/core/utility/date-setting.service";
import {finalize} from "rxjs/operators";
export type UserStateLock = 'cop' | 'reg';

export interface IParametriDelete {
  sensorId: string;
  anno: number | string;
  dbId: UserStateLock;
}

@Injectable({
  providedIn: 'root'
})
export class DatalocksService {

  private idTab: number = 0;
  instanceTimer?: { date: string };
  private _stopTimer = new Subject<void>();
  private timer$?: Observable<number>;

  constructor(
    private readonly http: HttpClient,
    private pollingService: PollingLockService,
    private readonly store: Store<AppState>,
    readonly localService: LocalService,
    private readonly dateSetting: DateSettingService
  ) {
    this.store.select('idTab').subscribe(id => this.idTab = id);
  }

  /**
   * Retrieves the state of a sensor lock.
   *
   * @param {string} key - The key associated with the sensor lock.
   * @returns {Observable<IGetStatusLock>} - An observable that emits the state of the sensor lock.
   * @example
   * https://<server_name>/ariaweb/airvalidsrv/datalock/cop/13.001272.803.21
   */
  getSensorStateLock(key: string): Observable<IGetStatusLock> {
    return this.localService.getAnnoStore().pipe(
      switchMap(anno => this.http.get<IGetStatusLock>(`${environment.apiEndpoint}datalock/cop/${this.idTab}/${key}/${anno}`))
    )
  }

  /**
   * Fetches the sensor state based on provided parameters and database type.
   *
   * @param {Object} param - The parameters for the sensor state lookup.
   * @param {string} param.key - The key to identify the specific sensor state.
   * @param {string} param.name - The name to accompany the response data.
   * @param {'cop'|'reg'} db - The database type from which to fetch data; defaults to 'cop'.
   * @return {Observable<IResponseLockWithName>} An observable emitting the response with lock and name data.
   */
  senorStateLook({key, name}: Pick<Parametro, 'key'|'name'>, db: 'cop'|'reg' = 'cop'): Observable<IResponseLockWithName> {
    return this.localService.getAnnoStore().pipe(
      switchMap(anno => this.http.get<IResponseLock>(`${environment.apiEndpoint}datalock/${db}/${this.idTab}/${key}/${anno}`)),
      map(response => ({...response, name}))
    )
  }

  /**
   * Sets a lock state for a sensor in the specified database.
   *
   * @param key - The key identifying the sensor.
   * @param name - The name associated with the sensor lock.
   * @param db - The database to use ('cop' or 'reg'). Defaults to 'cop'.
   * @return An Observable that emits the response containing the lock information with the provided name.
   */
  newSetSensorStateLock(key: string, name: string, db: 'cop'|'reg' = 'cop'): Observable<IResponseLockWithName> {
    return this.localService.getDataWithDataStore((start, end) => {
      let inizioAnno = format(Number(start), 'yyyy');
      if (this.dateSetting.isFirstMinuteOfYear(new Date(Number(end)))) {
        end = subYears(Number(end), 1).getTime().toString();
      }
      let fineAnno = format(Number(end), 'yyyy');
      return this.http.put<IResponseLock>(`${environment.apiEndpoint}datalock/${db}/${this.idTab}/${key}/${inizioAnno}/${fineAnno}`, {}).pipe(
        map(response => ({...response, name}))
      )
    })
  }

  stopTimer(){
    this._stopTimer.next();
    this.instanceTimer = undefined;
  }

  stopTimerPlusEmpty() {
    this.stopTimer();
    return EMPTY;
  }

  startTimer(time: number = environment.timerPollingDataLock): Observable<number> {

    if (!this.instanceTimer?.date) {
      console.info('Non esiste istanza creo una nuova');
      // Creo un oggetto instanzza timer che mi permette di capire quando c'è già una instanza e ci efitiamo di crearne altre
      this.instanceTimer = {
        date: format(Date.now(), 'HH:mm:ss'),
      };
      this.timer$ = interval(time).pipe(
        takeUntil(this._stopTimer),
        finalize(() => console.info('Timer concluso'))
        // switchMap((time) => of(time))
      );
      return this.timer$;
    }
    console.info('Esiste una istanza creo una nuova');
    this.stopTimer();
    return this.startTimer(time);
  }

  createTimer(){

  }

  /**
   * @description Cerca di ottener il lock per un dato sensore
   * @param {UserStateLock} dbId - Tipo BE leggere 'reg' or 'cop'
   * @param {string} key - Chiave sensore da leggere
   * @return Observable<IGetStatusLock>
   * @example
   * https://<server_name>/ariaweb/airvalidsrv/datalock/cop/13.001272.803.21
   */
  setSensorStateLock(key: string, dbId: UserStateLock = 'cop'): Observable<IGetStatusLock> {
    return this.localService.getDataWithDataStore((start, end) => {
      let inizioAnno = format(Number(start), 'yyyy');
      if (this.dateSetting.isFirstMinuteOfYear(new Date(Number(end)))) {
        end = subYears(Number(end), 1).getTime().toString();
      }
      let fineAnno = format(Number(end), 'yyyy');
      return this.http.put<IGetStatusLock>(`${environment.apiEndpoint}datalock/${dbId}/${this.idTab}/${key}/${inizioAnno}/${fineAnno}`, {})
    })
  }


  /**
   * @description Rilascia tutti i lock appartenenti all'utente
   * @params {dbId} dbId: identificatore del data base reg=regionale cop=Arpa per validazione
   * Esempio: https://<server_name>/ariaweb/airvalidsrv/datalock/cop
   */
  deleteUserStateLock(dbId: UserStateLock = 'cop'): Observable<number> {
    return this.http.delete<number>(`${environment.apiEndpoint}datalock/${dbId}/${this.idTab}`);
  }


  /** @description Rilascia il lock per un dato sensore
   * @params {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
   * @params {sensorId}: identificatore dell'oggetto sensore
   * @params {anno}: anno di riferimento
   * @example
   * https://<server_name>/ariaweb/airvalidsrv/datalock/cop/13.001272.803.21
   */
  deleteSensorStateLock(sensorId: string, anno: number | string, dbId: UserStateLock = 'cop',): Observable<IGetStatusLock> {
    return this.localService.getDataWithDataStore((start, end) => {
      start = format(+start, 'yyyy');
      end = format(+end, 'yyyy');

      return this.http.delete<IGetStatusLock>(`${environment.apiEndpoint}datalock/${dbId}/${this.idTab}/${sensorId}/${anno || start}/${end}`)
    })
  }


  /**
   * @description Service per la gestione di lista parametri per la delete del lock
   * @params {parametri} parametri: lista dei parametri da cui eliminare il lock
   * @params {dbId} dbId: identificatore del data base reg=regionale cop=Arpa per validazione
   * @params {anno} anno: anno di riferimento
   * @example
   * this.dataLockService.deleteLockOfListParameters(parametri, {dbId: 'cop', anno: 2020})
   */
  deleteLockOfListParameters(parametri: ReadonlyArray<IParameter>, params?: Partial<IParametriDelete>) {
    let {dbId, anno} = params ?? {dbId: 'cop', anno: ''};
    // Nel caso in cui non venga passato l'anno, viene preso quello di default dalla storage
    // if (!anno) {
    //   anno = moment(+this.localService.getItem('startDate')!)
    //     .utcOffset('+0100')
    //     .format('YYYY');
    // }
    return forkJoin(parametri.map(({parametro}: IParameter) => this.deleteSensorStateLock(parametro.key, anno!, dbId)))
  }

  /**
   * @description Riceve una lista di parametri ed effettua il setLock solo dei parametri con la proprietà extrainfo write or advance
   * @params {parametri} parametri: lista dei parametri da cui eliminare il lock
   *
   */
  setLockOfListParameters(parametri: ReadonlyArray<IParameter>, params?: Partial<IParametriDelete>): Observable<readonly IParameter[]> {

    // Nel caso che la lista sia vuota
    if (!parametri.length) {
      return this.deleteUserStateLock().pipe(
        map<number, IParameter[]>(() => [])
      );
    }
    // Verifico che i parametri abbiano la proprietà extrainfo write or advance
    let listaLock = parametri.filter(({parametro}: IParameter) => parametro.extraInfo.includes('write') || parametro.extraInfo.includes('advanced'));
    // let {dbId, anno} = params ?? {dbId: 'cop', anno: ''};
    // Costruisco il body per il setLock
    // Nel caso in cui non venga passato l'anno, viene preso quello di default dalla storage
    // if (!anno) {
    //   anno = moment(+this.localService.getItem('startDate')!)
    //     .utcOffset('+0100')
    //     .format('YYYY');
    // }
    return forkJoin(listaLock.map(({parametro}: IParameter) => this.setSensorStateLock(parametro.key)))
      .pipe(
        map((response) => {
          this.pollingService.setArray(listaLock.map(({parametro}: IParameter) => this.setSensorStateLock(parametro.key)) as any)
          return parametri;
        })
      )
  }


  /**
   * @description Ricevo un lista di parametri e in base alla extra info facciamo il setLock o il get dell stato del lock
   * @params {IParameter[]} parametri: lista dei parametri da cui eliminare il lock
   */
  getALlLockOfListParameters(parametri: ReadonlyArray<IParameter>) {
    return forkJoin([...parametri.map(({parametro, ...elemento}) => {
      let lockTypes = ['write', 'advanced', 'write advanced'];
      let isWriteOrAdvanced = lockTypes.includes(parametro.extraInfo);
      let isPipePresent = parametro.key.includes('|');
      let hasExtraInfo = parametro.extraInfo.includes('write') || parametro.extraInfo.includes('advanced');
      const obs: Observable<IGetStatusLock> = hasExtraInfo && !isPipePresent && !parametro.virtual ? this.setSensorStateLock(parametro.key) : of<IGetStatusLock>({
        myLock: false,
        locked: false,
        userInfo: '',
        date: new Date().getTime(),
        userId: '',
        year: new Date().getFullYear(),
        measurementId: parametro.key,
        measurementID: parametro.key,
        userID: ''
      });
      return obs.pipe(
        map((value) => {
          // console.info('value', value);
          // console.info('parametro', parametro);
          return {
            ...elemento,
            ...value,
            // locked: value.locked && !value.myLock,
            userLock: value.userInfo,
            dataFormatted: isValid(new Date(value.date)) ? format(new Date(value.date), 'dd/MM/yyyy HH:mm:ss') : '',
            parametro
          }
        })
      )
    })])
  }


}
