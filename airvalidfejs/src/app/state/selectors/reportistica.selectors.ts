/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {AppState} from "../index";
import {createSelector} from "@ngrx/store";
import {TypeValueToSpecialistico} from "../effects";
import {IListReport, IReportisticaState} from "../reducer";


export const reportisticaFeatureSelector = (state: AppState) => state.reportistica!;

export const periodoReportisticaSelector = createSelector(
  reportisticaFeatureSelector,
  (state) => state.periodoDialog
)
export const listParametriReportisticaSelector = createSelector(
  reportisticaFeatureSelector,
  (report: IReportisticaState) => report?.parametriReport
)
export const dbAndAllReportisticaSelector = createSelector(
  reportisticaFeatureSelector,
  periodoReportisticaSelector,
  listParametriReportisticaSelector,
  (report, periodo, parametri) => ({
    db: report?.db,
    periodo,
    parametri
  })
)

export const dbReportisticaSelector = createSelector(
  reportisticaFeatureSelector,
  (state) => state.db!
)


const _ritornaListaReport = (tipo?: TypeValueToSpecialistico, state?: IReportisticaState) => {
  let obj: Record<TypeValueToSpecialistico, Array<IListReport>> = {
    nonvalidato: state?.listNotValid ?? [],
    validato: state?.listValidata ?? [],
    noncertificato: state?.listNotCertified ?? [],
    certificato: state?.listCertified ?? [],
    assenti: state?.listAssenti ?? [],
    validatonullo: state?.listValidationNull ?? [],
    ipametalli: state?.listIpaMetalli ?? [],
    darivedere: state?.listDaRivedere ?? []
  }
  return obj[tipo!];
}
const _ritornaTitleToReport = (tipo?: TypeValueToSpecialistico) => {
  let obj: Record<TypeValueToSpecialistico, string> = {
    nonvalidato: 'Non Validato',
    validato: 'Validato',
    noncertificato: 'Non Certificato',
    certificato: 'Certificato',
    assenti: 'Assenti',
    validatonullo: 'Validazione Nulla',
    ipametalli:'IPA e metalli',
    darivedere: 'Da Rivedere'
  }
  return !tipo ? '' : obj[tipo];
}

export const listValidDataSelector = createSelector(
  reportisticaFeatureSelector,
  (report) => {
    if (!report?.select_report?.value) return undefined;
    return {
      data: _ritornaListaReport(report?.select_report?.value!, report),
      title: _ritornaTitleToReport(report?.select_report?.value!)
    }
  }
)

export const stateToReportSelector = createSelector(
  reportisticaFeatureSelector,
  (report) => ({
    listValidata: report?.listValidata,
    listNotValid: report?.listNotValid,
    listCertified: report?.listCertified,
    listNotCertified: report?.listNotCertified,
    listAssenti: report?.listAssenti,
    listValidationNull: report?.listValidationNull,
    listIpaMetalli: report?.listIpaMetalli,
    listDaRivedere: report?.listDaRivedere,
  })
)

export const listStandardReportSelector = createSelector(
  reportisticaFeatureSelector,
  (report) => report?.listStandardReport
)

export const listaReportStandardAndControlli = createSelector(
  stateToReportSelector,
  listStandardReportSelector,
  (controlli, standard) => ({
    controlli,
    standard
  })
)

export const listNotCertifiedSelector = createSelector(
  reportisticaFeatureSelector,
  (report) => report?.listNotValid
)

export const dialogReportisticaLavoroSelector = createSelector(
  reportisticaFeatureSelector,
  (state) => state.periodoDialog.lavoro
)

export const reportSelezionatoElaborazioneSelector = createSelector(
  reportisticaFeatureSelector,
  (state) => state.reportToDialog!
)




