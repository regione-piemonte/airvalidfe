/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from '@angular/core';
import {UtilityService} from '../../../core/services';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {
  changeLockValidazioneAction,
  changePeriodAction,
  changeValoriDettaglioAction,
  changeValoriParametroSelezionatoParametroAction,
  errorRicercaParametroAction, eventiToParametroAction,
  initParametroAction,
  registrazioneParametroAction,
  setInputChangedDettaglioAction,
   setStateLockValidazioneAction
} from '@actions/*';
import {forkJoin, iif, map, mergeMap, Observable, of, pairwise, switchMap, withLatestFrom} from 'rxjs';
import {DatalocksService, EventiService} from '@services/core/api';
import { IResponseLockWithName} from '@models/interface/BE/response/getLock';
import {IParameter, Parametro} from '@models/dataService';
import {AppState} from "../../index";
import {Store} from "@ngrx/store";
import {changesValidazioneSelector, dialogLavoroSelector, parametroSelector} from "@selectors/*";
import IGetEventsResponse from '@models/eventi/getEvents'
import { startWith, catchError, exhaustMap, filter, tap, } from "rxjs/operators";
import {format} from "date-fns";
import { Stazione} from "@models/grafico";
import {UtilityClass} from "@components/shared/utily/utily.class";

@Injectable()
export class RicercaEffects {

  constructor(
    private readonly dataLockService: DatalocksService,
    private readonly actions$: Actions,
    private readonly store: Store<AppState>,
    private eventService: EventiService,
    private utilityService: UtilityService,
  ) {
  }

  /**
   * Retrieves the lock state based on the provided parameter and optional station.
   *
   * @param {Parametro} parametro - The parameter that influences the lock state.
   * @param {Stazione} [stazione] - An optional station that can affect the lock state.
   * @return {Observable<IResponseLockWithName>} An observable that emits the lock state.
   */
  private _getLockState(parametro:Parametro, stazione?: Stazione): Observable<IResponseLockWithName> {
    let {name, isVirtual,isWrite, par$} = this._processParameter( parametro, stazione);
    return iif(() => !isVirtual && isWrite,
      this.dataLockService.senorStateLook({key: parametro.key, name}),
      of(par$),
    )
  }

  /**
   * Puts a new sensor state lock or retrieves an existing one based on the provided parameter.
   *
   * @param {IResponseLockWithName} parametro - The parameter containing lock information and the measurement ID.
   * @return {Observable<IResponseLockWithName>} Observable that emits the result of either setting a new lock or returning the existing parameter.
   */
  private _putOrGetLock(parametro:IResponseLockWithName): Observable<IResponseLockWithName> {

    let isVirtual = parametro?.parametro?.virtual || false;
    let isWrite = !parametro.parametro?.extraInfo ? false : parametro?.parametro?.extraInfo.includes('write') || parametro?.parametro?.extraInfo.includes('advanced');
    return iif(() => parametro?.myLock || false,
      this.dataLockService.newSetSensorStateLock(parametro.measurementId!, parametro.name!),
      this._getLockState({...parametro.parametro!, name: parametro.name ||''})
      )
  }

  /**
   * Processes the given parameter along with the station information if provided.
   *
   * @param {Stazione | undefined} stazione - The station information. Can be undefined.
   * @param {Parametro} parametro - The parameter to process.
   * @return {name, isVirtual, isWrite,par$ }
   */
  private _processParameter( parametro: Parametro,stazione?: Stazione): {name: string; isVirtual: boolean;isWrite: boolean; par$: IResponseLockWithName} {
    let name = stazione ? UtilityClass.getAParameterAndStationName({parametro, stazione}) : parametro.name;
    let isVirtual = parametro.virtual || false;
    let isWrite = parametro.extraInfo.includes('write') || parametro.extraInfo.includes('advanced');
    let isVirtualIsNotWrite = isVirtual || !isWrite;
    let par$: IResponseLockWithName = {
      ...parametro,
      name,
      parametro,
      measurementId: parametro.key,
      beginYear: parametro.beginDate,
      endYear: parametro.endDate,
      userId: '',
      userInfo: '',
      locked: false,
      myLock: false,
      contextId: '',
      date: 0
    }
    return {name, isVirtual, isWrite, par$};
  }


  /**
   * @description Ricerca parametri passati per settare anche il lock
   */
  getLockToParametro$ = createEffect(() =>
    this.actions$.pipe(
      ofType(registrazioneParametroAction),
      withLatestFrom(this.store.select(dialogLavoroSelector)),
      map(([{parametri, reload}, lavoro]) => ({parametri, reload, lavoro})),
      exhaustMap(({parametri, reload, lavoro}) =>
        iif(() => lavoro === 'validazione',
          // TODO da controllare che non parra il polling
          this.dataLockService.getALlLockOfListParameters(parametri).pipe(map(data => ({data, reload}))),
          of({data: parametri, reload})
        )
      ),
      map(({data, reload}) => initParametroAction(data, reload)),
      catchError((error) => of(errorRicercaParametroAction('key', `Get in errore per item: ${error}`)))
    )
  );

  setLockListaParametriValidazione$ = createEffect(() => this.actions$.pipe(
    ofType(initParametroAction),
    tap(value => console.info(value.parametri, 'Init Parametro')),
    map(({parametri}) => {
      let lista = parametri.map<IResponseLockWithName>(parametro => ({
        name: UtilityClass.getAParameterAndStationName(parametro),
        parametro: parametro.parametro,
        myLock: parametro.myLock,
        locked: parametro.locked,
        measurementId: parametro.measurementId,
        userInfo: parametro.userInfo
      }));
      return setStateLockValidazioneAction(lista);
    })
  ))

  // setLockListaParametro$ = createEffect(() => this.actions$.pipe(
  //   ofType(registrazioneParametroAction),
  //   withLatestFrom(this.store.select(dialogLavoroSelector)),
  //   map(([{parametri, reload}, lavoro]) => ({parametri, reload, lavoro})),
  //   switchMap(({parametri, reload}) => forkJoin(parametri.map(({parametro, stazione}) => {
  //     return this._getLockState(parametro, stazione);
  //   }))
  //     .pipe(
  //       map(stateLock => stateLock.map(res => ({...res, parametro: parametri.find(par => par.parametro.key === res.measurementId)?.parametro})),),
  //       // finalize(() => this.dataLockService.startTimer(30000))
  //       tap(response => console.log('Registrazione Par', {response, parametri, listaState: response.map(res => ({...res, parametro: parametri.find(par => par.parametro.key === res.measurementId)?.parametro}) )}))
  //     )),
  //   map(stateLock => setStateLockValidazioneAction(stateLock)),
  //   catchError((error) => of(errorRicercaParametroAction('key', 'get andata in errore')))
  // ))

  private _forkAllParametri() {
    return (source: Observable<{timer: string; state: IResponseLockWithName[]}>) => source.pipe(
      mergeMap(({state}) => forkJoin(state.map(par => this._putOrGetLock(par)))),
      startWith([]),
      pairwise()
    )
  }

  private _mergeLista() {
    return (source: Observable<{response: IResponseLockWithName[]}>) => source.pipe(
      mergeMap(({response}) => {
        let lista = [...response];
        return !lista.length ? this.dataLockService.stopTimerPlusEmpty() : this.dataLockService.startTimer(10000).pipe(
          map(timer => ({timer: format(Date.now(), 'hh:mm:ss'), state: lista})),
          tap(valore => console.info('Nel mezzo del timer',{...valore}))
        )
      })
    )
  }



  listenToStateLock$ = createEffect(() => this.actions$.pipe(
    ofType(setStateLockValidazioneAction),
    this._mergeLista(),
    this._forkAllParametri(),
    withLatestFrom(this.store.select(changesValidazioneSelector)),
    tap(([[prima, seconda], stateLock]) => console.info(`Data ${format(Date.now(), 'HH:mm:ss')}`, {prima,seconda, stateLock, test:  UtilityClass.getElementToList(prima,seconda,'measurementId',['myLock', 'locked'])})
    ),
    filter(([[prima, seconda], stateChanges]) => {
      let elementToList = UtilityClass.getElementToList(prima,seconda,'measurementId',['locked','myLock']);
      return !!elementToList.length;
    }),
    map(([[prima, seconda], stateChanges]) => changeLockValidazioneAction(UtilityClass.getElementToList(prima,seconda,'measurementId',['locked','myLock'])))
  ))



  /**
   * @description Rimane in ascolto della azione Registrazione Parametri
   */
  getParametri$ = createEffect(() =>
    this.actions$.pipe(
      ofType(registrazioneParametroAction),
      filter(({parametri, reload}) => !reload),
      map(({parametri, reload}) => changeValoriDettaglioAction()),
      catchError((error) => of(errorRicercaParametroAction('key', `Get in errore per item: ${error}`)))
    )
  );

  /**
   * Effect to trigger a change period action in response to a registration parameter action.
   *
   * This observable reacts to actions of type `registrazioneParametroAction`
   * and maps them to dispatch a `changePeriodAction` with a payload of `false`.
   */
  setChangePeriodo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(registrazioneParametroAction),
      map(() => changePeriodAction(false)),
    )
  );

  /**
   * @description Dopo l'initParametro verifichiamo che se c'è un parametro selezionato e ne cambiamo i valori
   */
  changeValoriParametroSelezionato$ = createEffect(() =>
    this.actions$.pipe(
      ofType(initParametroAction),
      withLatestFrom(this.store.select(parametroSelector)),
      map(([{parametri, reload}, parametro]) => ({parametri, parametro, reload})),
      filter(({parametri, parametro}) => !!parametri.find(item => item.measurementId === parametro?.parameter.measurementId)),
      map(({parametro, reload, parametri}) => {
        let matchingParametro = parametri.find(item => item.measurementId === parametro?.parameter.measurementId);
        return changeValoriParametroSelezionatoParametroAction(matchingParametro!);
      })
    )
  );


  selectParametro$ = createEffect(() => this.actions$.pipe(
    ofType(setInputChangedDettaglioAction),
    map(({input}) => ({...input})),
    switchMap(({parameter, dataset}) => {
      const parameterExtraInfo = parameter?.parametro?.extraInfo;

      if (!parameterExtraInfo) {
        return of([] as Array<IGetEventsResponse>);
      }

      return this.eventService.searchEvent(parameter.key ?? parameter?.parametro?.key!, {
        start: dataset![0].timestamp,
        end: dataset![dataset!.length - 1].timestamp
      }).pipe(
        catchError(err => {
          // console.error('Errore durante la ricerca degli eventi:', err);
          return of([] as Array<IGetEventsResponse>);
        }),
        // tap(eventi => console.info('eventi', eventi))
      );
    }),
    map(eventi => eventiToParametroAction(eventi))
  ));


  // selectParametro$ = createEffect( () => this.actions$.pipe(
  //   ofType( selectParametroAction ) ,
  //   map( data => resetPointActionDettaglio() )
  // ) );

  // createListParametersWriteOrAdvanced$ = createEffect( () => this.actions$.pipe(
  //   ofType( saveDialogParameterAction ) ,
  //   map(({data}) => {
  //     let {all, selected} = data;
  //     let writeOrAdvanced = all.filter( ( {extraInfo}) => extraInfo.includes( 'write' ) || extraInfo.includes( 'advanced' ) );
  //     let notWriteOrAdvanced = all.filter( item => !writeOrAdvanced.some(item2 => item.key === item2.key) );
  //     return createListToIDataParametroAction({ writeOrAdvanced , notWriteOrAdvanced });
  //   } )
  // ) );

}
