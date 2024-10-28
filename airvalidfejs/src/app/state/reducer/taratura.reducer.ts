/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {createAction, createReducer, createSelector, on} from "@ngrx/store";
import {AppState, initialStateTarature, TipoTarature} from "../index";


export const changeTypeTaratura = createAction('[Taratura] Change type taratura', (tipo: TipoTarature) => ({tipo}));

export const taraturaReducer = createReducer(
  initialStateTarature,
  on(changeTypeTaratura, (state, {tipo}) => ({
      ...state,
      tipoTarature: tipo ? 'constant' : 'progressive'
    })
  )
);

const taratureSelector = (state: AppState) => state.taratura;

/**
 * Selector function to retrieve `tipoTarature` from the state.
 *
 * This function uses a memoized selector created by `createSelector`
 * from the `reselect` library. It relies on `taratureSelector` to
 * first obtain the state slice and then extracts the `tipoTarature`
 * property from it.
 *
 * @returns {any} The value of `tipoTarature` from the state.
 */
export const tipoTaratureSelector = createSelector(
  taratureSelector,
  (state) => state.tipoTarature
);



