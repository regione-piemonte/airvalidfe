/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {AppState} from "../index";
import {createSelector} from "@ngrx/store";

export const validazioneSelector = (state:AppState) => state.validazione;

export const changesValidazioneSelector = createSelector(
  validazioneSelector,
  (state) => state.changes
);

export const stateLockValidazioneSelector = createSelector(
  validazioneSelector,
  (state) => state.stateLock
);

export const limitiValidazioneSelector = createSelector(
  validazioneSelector,
  (state) => state.limiti
);
