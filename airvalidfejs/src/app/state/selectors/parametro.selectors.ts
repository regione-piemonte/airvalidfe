/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { AppState } from '../index';
import { createSelector } from '@ngrx/store';
import {stateLockValidazioneSelector} from "./validazione.selector";

export const parametroFeature = ( state: AppState ) => state.parametri;


/**
 * Creates a selector function to select the "parametri" property from the "parametroFeature" state.
 *
 * @param {Function} parametroFeature - The selector function to select the "parametroFeature" state from the Redux store.
 * @return {Function} - The selector function to select the "parametri" property from the "parametroFeature" state.
 */
export const parametriSelector = createSelector(
  parametroFeature ,
  ( state ) => state.parametri!
);

export const listaParametriSelector = createSelector(
  parametroFeature,
  (state) => state.parametri?.length
)

/**
* @description Selettore per il reset dello state Parametro component
*/
export const resetStateSelector = createSelector(
  parametroFeature,
  ( state ) => state.reset
)

/**
* @description Unione do parametro selezionato e lista parametri
*/
export const parametroSelezionatoSelectorWithListParameters = createSelector(
  parametroFeature ,
  ( state ) => ({
    parametro: state.parametro_selezionato,
    lista: state.parametri,
  })
);

/**
* @description Data polling selector
*/
export const dataPollingSelector = createSelector(
  parametroFeature ,
  ( state ) => state.dataPolling
);

/**
* @description Selector per il PollingParametri, che serve a capire quando siamo in polling
*/
export const pollingParametriSelector = createSelector(
  parametroFeature ,
  ( state ) => state.pollingParametri
);


/**
 * @description Selector per il parametro selezionato
 */
export const parametroSelector = createSelector(
  parametroFeature ,
  ( state ) => state.parametro_selezionato
)

export const parametroWithValidazioneStateSelector$ = createSelector(
  parametroSelector,
  stateLockValidazioneSelector,
  ( parametro, stateValidazione) => {
    return stateValidazione.find(item => item.measurementId === parametro?.parameter.parametro.key)
  }
);

export const parametroSelectorEventi = createSelector(
  parametroFeature ,
  ( state ) => state.eventiToParametro
)

export const parametroSelezionatoWithReloadPeriodo = createSelector(
  parametroFeature ,
  ( state ) => ({
    parametro: state.parametro_selezionato,
    reloadPeriodo: state.reloadPeriodo
  })
)

/**
* @description Parametro ricaricato
*/
export const selectParametroRicaricato = createSelector(
  parametroFeature ,
  ( state ) => state.parametro_ricaricato
)

export const listaParametri = createSelector(
  parametroFeature ,
  ( state ) => state.locksParametri
);

export const parametriWithLock = createSelector(
  parametroFeature ,
  ( state ) => state.getLockParametro
)

export const parametroDeleted = createSelector(
  parametroFeature ,
  ( state ) => state.parametro_eliminato
)

export const showNotValidDataSelector = createSelector(
  parametroFeature ,
  ( state ) => state.showNotValidData
)

export const showValidDataWithParametroSelezionato = createSelector(
  parametroFeature ,
  ( state ) => ({
    parametro: state.parametro_selezionato,
    azione: state.azioneSelezionata,
    stato: state.showNotValidData
  })
)

export const listaParametriSelezionatiSelector = createSelector(
  parametroFeature ,
  ( state ) => state.listaParametri
)
/**
 * Selector to retrieve and transform specific state parameters.
 *
 * This selector leverages the `parametroFeature` to extract the `datiDaRichiamare` and periodo
 */
export const changePeriodoParametriSelector = createSelector(
  parametroFeature ,
  ( state ) => state.datiDaRichiamare?.periodo
)

