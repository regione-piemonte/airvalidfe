/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {AppState} from "../index";
import {createSelector} from "@ngrx/store";


export const elaborazioneFeatureSelector = (state: AppState) => state.elaborazione!;

export const elaborazionePeriodoSelector = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.selezioneElaborazione!
)

export const listaGraficiElaborazioniSelector = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.tipiGrafici
)

export const requestOfGetElaborazioneSelector = createSelector(
  elaborazioneFeatureSelector,
  (state) => ({
    db: state.db,
    startDate: state.selezioneElaborazione?.startDate,
    endDate: state.selezioneElaborazione?.endDate,
    parametri: state.parametri,
  })
)

export const dbElaborazioneSelector = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.db
);

export const getGraficiAndDatiStateElaborazioniSelector = createSelector(
  listaGraficiElaborazioniSelector,
  requestOfGetElaborazioneSelector,
  (grafici, state) => ({
    grafici,
    state
  })
)

export const activeGraficiElaborazioniSelector = createSelector(
  listaGraficiElaborazioniSelector,
  (grafici) => grafici.filter(grafico => grafico.active)
);
export const parametriElaborazioneSelector = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.parametri
);
export const indexDettaglioElaborazioneSelector = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.indexDettaglio
);

export const parametriAndGraficiSelector = createSelector(
  parametriElaborazioneSelector,
  listaGraficiElaborazioniSelector,
  indexDettaglioElaborazioneSelector,
  (parametri, grafici, indexDettaglio) => {
    return {
      parametri,
      grafici,
      indexDettaglio
    };
  }
);

export const listaVisibilityElaborazioneSelector = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.parametriVisibility
);

export const parametroSelezionatoElaborazioneSelector = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.parametroVisibility
);

/**
 * Selettore per recuperare il rapporto di avanzamento dallo stato dell'applicazione.
 * @returns {number} The progress report state.
 */
export const progressElaborazioneSelector = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.progressReport
);






