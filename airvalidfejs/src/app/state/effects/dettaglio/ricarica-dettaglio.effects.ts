/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {
  changeDatasetDettaglioAction,
  changeValoreParametroAction,
  reloadDettaglioDettaglioAction,
  resetOnPointGraficoAction,
  resetPointActionDettaglio,
  saveSuccessDettaglioAction,
  saveSuccessGraficoAction,
  setDataSetChangedDettaglioAction,
  setInputChangedDettaglioAction, setLockStateValidazioneAction, setStateLockValidazioneAction,
  setValoriGrafico,
  setValoriTabellaDettaglioAction
} from '@actions/*';
import {map, switchMap, withLatestFrom} from 'rxjs';
import {AppState} from '../../index';
import {Store} from '@ngrx/store';
import {listGraficiSelector, selectDataSetInputSelector, selectDataSetSelector, selectInputSetSelector, stateLockValidazioneSelector} from "@selectors/*";
import {Dataset, IGrafico, IOutput} from "@models/grafico";
import {DatalocksService, DatasService} from "@services/core/api";
import {IPaginaTabella} from "@components/shared/validazione-dettaglio/models/time-selected.model";
import {tap} from "rxjs/operators";


@Injectable()
export class DettaglioEffects {

  constructor(
    private readonly actions$: Actions,
    private readonly storeService: Store<AppState>,
    private readonly datasService: DatasService,
    private readonly lockService: DatalocksService
  ) {
  }

  ricaricaDettaglio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(reloadDettaglioDettaglioAction),
      // switchMap( ( { parametro_key } ) => this.storeService.select(parametroSelector)),
      map((value, index) => resetPointActionDettaglio()),
    )
  );


  /**
   * @description Ascolto il reset del punto e resetto i punti modificati
   */
  resetPoint$ = createEffect(() =>
    this.actions$.pipe(
      ofType(reloadDettaglioDettaglioAction),
      map(() => resetOnPointGraficoAction())
    )
  );

  /**
   * @description Avviso il componente dei parametri che il reload è avvenuto
   */
  listenReload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(reloadDettaglioDettaglioAction),
      map((value) => changeValoreParametroAction(value.parametro_key))
    )
  );

  /**
   * @description Ascolto per chiamare il servizio e prendere i dati originali
   */
  ricaricaDatiOriginali$ = createEffect(() =>
    this.actions$.pipe(
      ofType(reloadDettaglioDettaglioAction),
      switchMap(({parametro_key, period_m, parametro}) => {
        // console.info('reloadDettaglioDettaglioAction', {parametro_key, period_m});
        return this.datasService.getSensorData(parametro_key, period_m,).pipe(
          map((value) => ({value, parametro})),
        )
      }),
      map(({value, parametro}) => {
        // console.info('getSensorData', value);
        return setValoriGrafico({dataset: value, parametro: parametro!})
      })
    )
  );

  putLockParametro$ = createEffect(() => this.actions$.pipe(
    ofType(reloadDettaglioDettaglioAction),
    // TODO da verificare se devo prima vedere dalla lista dei changes
    switchMap(({parametro_key, period_m, parametro}) => this.lockService.setSensorStateLock(parametro_key)),
    map(lock => setLockStateValidazioneAction(lock))
  ))

  listenSetLockParametro$ = createEffect(() => this.actions$.pipe(
    ofType(setLockStateValidazioneAction),
    withLatestFrom(this.storeService.select(stateLockValidazioneSelector)),
    tap( value => console.info(value, 'ascolto il setLock')),
    map(([parametro, stateLock]) => setStateLockValidazioneAction(stateLock))
  ))

  /**
   * @description Quando faccio il reload del parametro devo ricaricare anche i valori del input selezionato
   */
  ricaricaInput$ = createEffect(() =>
    this.actions$.pipe(
      ofType(setValoriGrafico),
      withLatestFrom(this.storeService.select(selectInputSetSelector)),
      map(([value, input]) => {
        // console.info('value', value);
        // console.info('input', input);
        // value è il dataset che è stato ricaricato completo, devo prendere solo i valori del input
        // che sono stati selezionati
        const {dataset, parametro} = value;
        // prendo la sezione del input che mi interessa
        const {parameter, dataset: dataInput} = input!;

        const startTimestamp = dataInput![0].timestamp;
        const endTimestamp = dataInput![dataInput!.length - 1].timestamp;

        const filteredData = dataset.filter(data => data.timestamp >= startTimestamp && data.timestamp <= endTimestamp);

        // sostituisco il dataset con quello modificato
        const inputChanged = {
          ...input,
          dataset: filteredData
        }
        return setInputChangedDettaglioAction(inputChanged)
      })
    )
  );

  private _paginateAndModifyDataset(originalDataset: Dataset[], {
    pageSize,
    index,
    length
  }: IPaginaTabella, modify: Dataset[]): Dataset[] {
    const start = index * pageSize;
    const end = start + pageSize;
    const modifiedList = [...originalDataset];
    modifiedList.splice(start, end - start, ...modify);
    return modifiedList;
  }

  /**
   * @description Effetto per chiamare la action dove prendo solo le modifiche
   */
  getValueChanged$ = createEffect(() =>
    this.actions$.pipe(
      ofType(setValoriTabellaDettaglioAction),
      // tap((value) => console.info('setValoriTabellaDettaglioAction', value)),
      withLatestFrom(this.storeService.select(selectDataSetInputSelector)),
      // filter( ([action, value]) => !!value && value.some( (valore) => valore.pagina_tabella.index === action.value.pagina_tabella.index ) ),
      map(([value, dataSetOriginale]) => {
        let {valori_pagina_tabella, pagina_tabella, dataSet_changed} = value.value;
        // console.info('valori_pagina_tabella', valori_pagina_tabella);
        // console.info('pagina_tabella', pagina_tabella);
        // console.info('dataSet_changed', dataSet_changed);
        // console.info('dataSetOriginale', dataSetOriginale);

        const datasets = this._paginateAndModifyDataset(dataSetOriginale!, pagina_tabella, valori_pagina_tabella);

        return setDataSetChangedDettaglioAction(datasets);
      })
    )
  );

  /**
   * @description Effetto per chiamare set input change dopo il ricarica dettaglio avvenuto
   */
  setInputChanged$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveSuccessDettaglioAction),
      map(({input}) => {
        // console.info('setDataSetChangedDettaglioAction', input);
        // prendo i valori del input e li modifico con i valori del grafico che sono stati ricaricati

        return setInputChangedDettaglioAction(input)
      })
    ));

  private static updateDataset(grafico: IGrafico, primoIndex: number, input: Partial<IOutput>) {
    return {
      ...grafico,
      dataset: [...grafico.dataset.slice(0, primoIndex), ...input.dataset!, ...grafico.dataset.slice(primoIndex + input.dataset!.length)]
    }
  }


  private static replaceDataSetAtIndex(listDataSet:Array<IGrafico>, input: Partial<IOutput>, grafico: IGrafico): Array<IGrafico> {
    return [...listDataSet.slice(0, input.index!), grafico, ...listDataSet.slice(input.index! + 1)];
  }

  private static updateListDataSetAndGrafico(listDataSet: Array<IGrafico>, input: Partial<IOutput>) {
    // Ricerco il grafico
    let grafico = listDataSet.find(findGrafico(input.parameter?.parametro?.key))!;
    // Ricerco il primo timeStamp del grafico
    let primoIndex = grafico.dataset.findIndex(findIndex(input.dataset?.[0].timestamp));
    // Sostituisco il dataset con quello modificato
    grafico = DettaglioEffects.updateDataset(grafico, primoIndex, input);
    // Inserisco il dataset modificato
    listDataSet = DettaglioEffects.replaceDataSetAtIndex(listDataSet, input, grafico);
    return {listDataSet, grafico};
  }



  /**
   * @description Cambio il valore del dataset con quello salvato
   */
  setDatasetChanged$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveSuccessDettaglioAction),
      withLatestFrom(this.storeService.select(selectDataSetSelector)),
      map(([{input}, listDataSet]) => {

        const {grafico, listDataSet: upListDataSet} = DettaglioEffects.updateListDataSetAndGrafico(listDataSet, input);

        // prendo i valori del input e li modifico con i valori del grafico che sono stati ricaricati
        return changeDatasetDettaglioAction(upListDataSet, grafico.dataset)
      })
    ));




  /**
   * @description Prendo i grafici e cambio i valori dello stesso nello state dopo il salvataggio
   */
  listenSaveDettaglio$ = createEffect(() => this.actions$.pipe(
    ofType(saveSuccessDettaglioAction),
    withLatestFrom(this.storeService.select(listGraficiSelector)),
    map(([{input}, grafici]) => ({input, grafici})),
    map(({input, grafici}) => {

      let {listDataSet} = DettaglioEffects.updateListDataSetAndGrafico(grafici, input);
      return saveSuccessGraficoAction({grafici: listDataSet})
    }),
  ), {dispatch: true, })

}

function findGrafico(parametro?: string | number) {
  return (grafico: IGrafico, index: number) => grafico.key === parametro;
}

function findIndex(parametro?: string | number) {
  return (grafico : Dataset, index: number) => grafico.timestamp === parametro;
}
