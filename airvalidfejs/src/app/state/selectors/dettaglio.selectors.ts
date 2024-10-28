/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {AppState} from '../index';
import {createSelector} from '@ngrx/store';
import {IDettaglioState} from '../reducer';
import {changePeriodoParametriSelector, parametroDeleted, parametroSelector} from './parametro.selectors';
import {getSensorDataSelector} from './grafico.selectors';

export const dettaglioFeature = (state: AppState) => state.dettaglio;

export const lengthDataSetSelector = createSelector(
    dettaglioFeature,
    (state: IDettaglioState) => state.valori_grafico?.length
)
export const valoriGraficoSelector = createSelector(
    dettaglioFeature,
    (state: IDettaglioState) => state.valori_grafico
)

export const selectInputSetSelector = createSelector(
    dettaglioFeature,
    (state: IDettaglioState) => state.input
)

export const selectInputChangeSelector = createSelector(
  selectInputSetSelector,
  (input) => ({
    parameter: input?.parameter,
    dataset: input?.dataset,
    index: input?.index
  })
)

export const changesMassiveSelector = createSelector(
  dettaglioFeature,
  (state) => state.cambioMassivo ?? []
)

export const selectDataSetInputSelector = createSelector(
    selectInputSetSelector,
    (input) => input?.dataset
)

/**
 * @description Selector per la lista dei punti selezionati sul grafico
 */
export const selectPointsSelector = createSelector(
    dettaglioFeature,
    (state: IDettaglioState) => state.points
)

/**
 * @description Selettore per lista dei punti modificati nel grafico
 */
export const selectorPointsSelector = createSelector(
  dettaglioFeature,
  (state: IDettaglioState) => ({
    points: state.points,
    cambioMassivo: state.cambioMassivo,
  })
)

export const deleteParameterSelezionato = createSelector(
    parametroDeleted,
    selectInputSetSelector,
    (parametro, input) => {

        if (parametro && input) {
            const {parametro: par} = parametro;
            const {parameter: inputParameter} = input;
            return par.key === inputParameter?.parametro?.key
        }
        return false;
    }
)

export const listenChangePeriodoAndDeleteSelezionatoParametroSelector = createSelector(
  changePeriodoParametriSelector,
  deleteParameterSelezionato,
  (periodo, deleteParametro) => ({periodo, deleteParametro})
);

/**
 * @description Selector per la lista dei dataset con parametro selezionato
 */
export const getSensorDataToParametroSelezionatoDettaglioSelector = createSelector(
    parametroSelector,
    getSensorDataSelector,
    (parametro, getSensorData) => {
        if (parametro && getSensorData) {
            const {parameter: par, index} = parametro;
            const {dataset} = getSensorData[index];
            return {
                dataset,
                parametro: par,
                index
            }
        }
        return undefined;
    })

export const dettaglioRicaricatoSelector = createSelector(
    dettaglioFeature,
    (state: IDettaglioState) => state.dettaglio_da_ricaricare,
)

/**
 * @description Selector con la lista dei valori modificati
 */
export const setValueTabellaDettaglioSelector = createSelector(
    dettaglioFeature,
    (state: IDettaglioState) => state.setValue,
)

/**
 * @description Ritorna il valore del dataSet nello state
 */
export const selectDataSetSelector = createSelector(
    dettaglioFeature,
    (state: IDettaglioState) => state.dataset,
)

/**
* @description Ritorna il valore del polling
*/
export const hasPollingSelector = createSelector(
    dettaglioFeature,
    (state: IDettaglioState) => state.pollingParametri,
)
