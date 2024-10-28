/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {elaborazioneFeatureSelector} from "./elaborazione.selectors";
import {createSelector} from "@ngrx/store";
import {state} from "@angular/animations";


export const elaborazioneSpecialisticoSelector = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.specialistico
);

export const idReportSpecialisticoElaborazione = createSelector(
  elaborazioneSpecialisticoSelector,
  (state) => state.idReport
);

export const dbElaborazioneSelector = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.db
);

export const idReportSpecialisticoAndDbElaborazioneSelector = createSelector(
  idReportSpecialisticoElaborazione,
  dbElaborazioneSelector,
  (id, db) => ({
    idReport: id,
    db
  })
);

export const resolverSelector = createSelector(
  dbElaborazioneSelector,
  elaborazioneSpecialisticoSelector,
  (db,state) => ({
    id: state.idReport,
    keys: state.keysSensor,
    anni: state.anni,
    date: state.date,
    result: state.result,
    db
  })
)

export const idReportAndTime = createSelector(
  elaborazioneFeatureSelector,
  (state) => ({
    id: state.specialistico.idReport,
    time: state.specialistico.time,
    anni: state.specialistico.anni,
    date: state.specialistico.date,
    db: state.db
  })
);



export const yearsToSpecialisticoElaborazione = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.specialistico.time
)


export const networkSelectorElaborazione = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.specialistico.netWork
);

export const stationSelectorElaborazione = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.specialistico.station
)

export const sensorSelectorElaborazione = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.specialistico.sensor
);

export const parametriSpecialisticiElaborazioneSelector = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.specialistico.parametri
);

export const keysSensorElaborazioneSelector = createSelector(
  elaborazioneFeatureSelector,
  (state) => state.specialistico.keysSensor
);


