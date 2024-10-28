/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { AppState } from '../index';
import { createSelector } from '@ngrx/store';
import { IGraficoState  } from '../reducer';
import {parametriSelector, parametroSelector} from './parametro.selectors';

export const selectGraficoSelector = ( state: AppState ) => state.grafico;


export const selectParametroSelezionato = createSelector(
  selectGraficoSelector ,
  ( state: IGraficoState ) => state.parametro_selezionato
)

/**
 * @description Ritorna il periodo dataZoom con il parametro selezionato
 */
export const selectDataZoomWithParametro = createSelector(
  selectGraficoSelector ,
  parametroSelector,
  ( state, parametro ) => ({
    start: state.dataZoom?.start ,
    end: state.dataZoom?.end ,
    batch: state.dataZoom?.batch,
    parametro_selezionato: parametro
  })
)

export const clickOnPointSelector = createSelector(
  selectGraficoSelector ,
  ( state: IGraficoState ) => state.clickOnPoint
)

/**
 * @description Restituisce la lista dei grafici
 */
export const listGraficiSelector = createSelector(
    selectGraficoSelector ,
    ( state: IGraficoState ) => state.grafici
)

export const graficiNascostiSelector = createSelector(
  selectGraficoSelector,
  (state) => state.listaGraficiNascosti
);

export const parametriSelectorWithParametroNascostoSelector = createSelector(
  parametriSelector,
  graficiNascostiSelector,
  (parametroState, graficoState) => {
    return !!parametroState ? parametroState.map(par => {
      if (graficoState.some(key => key === par.parametro.key)) {
        return {...par, visible: false}
      }
      return par;
    }) : undefined;
  }
);

/**
 * @description Restituisce la lista dei grafici senza gli originali
 */
export const listGraficiWithoutOriginalSelector = createSelector(
  selectGraficoSelector ,
  ( state: IGraficoState ) => state.grafici.filter( grafico => !grafico.name.includes('origin')  )
)

/**
 * @description Restituisce i valori del getSensorData
 */
export const getSensorDataSelector = createSelector(
  selectGraficoSelector ,
  ( state: IGraficoState ) => state.getSensoreData
)

/**
* @description Restituisce un valore booleano che indica se è presente una lunghezza dei grafici
*/
export const isLengthGraficiSelector = createSelector(
  selectGraficoSelector ,
  ( state: IGraficoState ) => !!state.grafici?.length
)

/**
* @description Selezttore per il cambio della scala del grafico
*/
export const scalaGraficoSelector = createSelector(
  selectGraficoSelector ,
  ( state: IGraficoState ) => state.scalaGrafico
)

/**
* @description Selettore per il cambio periodo del grafico
*/
export const periodoGraficoSelector = createSelector(
  selectGraficoSelector ,
  ( state: IGraficoState ) => state.periodo
)
