/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {
  deleteAllParametroAction,
  deleteDettaglioToListsDettaglioAction,
  deleteDialogParameterAction,
  deleteGrafico, deleteLockToParametroAction,
  deleteParametriElaborazioneAction,
  deleteParametriSelezionatiAction,
  deleteParametroAction,
  deleteParametroElaborazioneAction,
  deleteParametroToListsAction, deleteParametroToMenuElaborazioniAction, deleteStateLockValidazioneAction,
  resetOnPointGraficoAction,
  resetStateParametroAction, setStateLockValidazioneAction
} from '@actions/*';
import {concatMap, exhaustMap, map, mergeMap, switchMap, withLatestFrom} from 'rxjs';
import {Store} from '@ngrx/store';
import {AppState} from '../../index';
import {parametriAndGraficiSelector, parametriSelector, selectInputSetSelector, stateLockValidazioneSelector} from '@selectors/*';
import {IParameter} from "@models/dataService";
import {IGraficiElaborazioni} from "@reducers/*";
import {DatalocksService} from "@services/core/api";

@Injectable()
export class DeleteEffects {

  constructor(
    private readonly actions$: Actions,
    private readonly storeService: Store<AppState>,
    private readonly lockService: DatalocksService,
  ) {
  }


  private _deleteParametroToStore(store: IParameter[], item:IParameter, grafici: IGraficiElaborazioni[], indexDettaglio?: string) {
    store = store.filter(itemStore => itemStore.parametro.key !== item.parametro.key);
    grafici = grafici.map(graficoStore => ({
      ...graficoStore,
      data: graficoStore.data.filter(grafico => grafico.id !== item.parametro.key)
    }));
    if (indexDettaglio === item.parametro.key) {
      indexDettaglio = undefined;
    }
    return {store, grafici, indexDettaglio};
  }

  deleteParametroToGrafico$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteParametroAction),
      map(({item}) => deleteGrafico(item.parametro.key))
    )
  );

  deleteParametroAndSetDialogParameter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteParametroAction),
      map(({item}) => deleteDialogParameterAction(item))
    )
  );

  deleteParametro$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteParametroAction),
      map(({item}) => deleteParametroToListsAction(item.parametro.key)),
    )
  );

  deleteDettaglio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteParametroAction),
      withLatestFrom(this.storeService.select(selectInputSetSelector)),
      // tap(value => console.info(value)),
      map(([action, input]) => ({item: action.item, input})),
      // filter(({item, input}) => input?.parameter?.parametro?.key === item.parametro.key),
      map(({item, input}) => deleteDettaglioToListsDettaglioAction(input!, item, input?.parameter?.parametro?.key === item.parametro.key))
    )
  );

  deleteClickOnPoint$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteDettaglioToListsDettaglioAction),
      map(({parametro, selezionato}) => resetOnPointGraficoAction(selezionato))
    )
  );

  deleteLockParametro$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteParametroAction),
      mergeMap(({item}) => this.lockService.deleteSensorStateLock(item.parametro.key, '')
        .pipe(
          map(() => item)
        ) ),
      map(lock => deleteLockToParametroAction(lock))

    )
  )

  beforeDeleteLockSetStateValidazioneLock$ = createEffect(() => this.actions$.pipe(
    ofType(deleteLockToParametroAction),
    withLatestFrom(this.storeService.select(stateLockValidazioneSelector)),
    map(([{parametro}, state]) => ({parametro, state})),
    map( ({parametro, state})=> {
      let newState = state.filter(item => item.measurementId !== parametro.parametro.key);
      return setStateLockValidazioneAction(newState);
    })
  ));

  deleteParametroToLists$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteParametriSelezionatiAction),
      withLatestFrom(this.storeService.select(parametriSelector)),
      map(([{parametri}, parametriStore]) => ({parametri, parametriStore})),
      concatMap(({parametri, parametriStore}) => {
        if (parametri.length === parametriStore.length) {
          return [resetStateParametroAction(true)]
        }
        return parametri.map(item => deleteParametroAction(item))
      })
    )
  );

  deleteStateValidazione$ = createEffect(() => this.actions$.pipe(
    ofType(deleteAllParametroAction),
    map(() => deleteStateLockValidazioneAction())
  ))

  deleteParametriElaborazione$ = createEffect(() =>
  this.actions$.pipe(
    ofType(deleteParametriElaborazioneAction),
    withLatestFrom(this.storeService.select(parametriAndGraficiSelector)),
    map( ([{parametri}, {parametri: store, grafici, indexDettaglio}]) => ({parametri, store, grafici, indexDettaglio})),
    concatMap(({parametri, store, grafici, indexDettaglio}) => {
      parametri.forEach(item => {
        const {store: storeDelete, grafici: graficiDelete, indexDettaglio: indexDelete} = this._deleteParametroToStore(store, item, grafici, indexDettaglio);
        store = storeDelete;
        grafici = graficiDelete;
        indexDettaglio = indexDelete;
      });
      console.info(store);
      console.info(grafici);

      return parametri.map(item => deleteParametroElaborazioneAction({store, grafici, indexDettaglio}));
    })
  ))


  deleteParametroToMenu$ = createEffect(() => this.actions$.pipe(
    ofType(deleteParametroToMenuElaborazioniAction),
    withLatestFrom(this.storeService.select(parametriAndGraficiSelector)),
    map(([{parametro}, {grafici, indexDettaglio, parametri: store}]) => {

      let {store: storeDelete, grafici: graficiDelete, indexDettaglio: indexDelete} = this._deleteParametroToStore(store,parametro,grafici,indexDettaglio);

      console.info(storeDelete);
      console.info(graficiDelete);
      return deleteParametroElaborazioneAction({store: storeDelete, grafici: graficiDelete,indexDettaglio: indexDelete})
    })
  ))


}
