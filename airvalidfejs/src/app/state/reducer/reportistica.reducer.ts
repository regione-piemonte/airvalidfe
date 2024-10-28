/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {createReducer, on} from "@ngrx/store";
import {initStateReportistica} from "../index";
import {
  addParametriReportisticaAction,
  callReport,
  callReportAssenti,
  callReportCertified,
  callReportNotCertified,
  callReportNotManaged,
  callReportNotValid,
  callReportIpaMetalli,
  callReportToReview,
  callReportValidationNull,
  IPropsChangeLavoro, newStateREportisticaAction, reportStandardAction, selectedReportisticaAction,
  selectPeriodoReportisticaAction,
  setDBReportisticaAction,
  setPeriodoReportisticaAction, setReportToInitReportisticaAction
} from "../actions";
import {UserStateLock} from "@services/core/api";
import {IResponseAllValidata, TypeValueToSpecialistico} from "../effects";
import {IParameter} from "@models/dataService";
import {ResponseToReport} from "@models/response/report.interface";
import {ToggleGroup} from "@dialog/*";


export type TypeSelectReport = { text: string, value: TypeValueToSpecialistico };

export interface IListReport {
  time: number;
  report: Array<IResponseAllValidata>;
  formato: string;
  periodo: IPropsChangeLavoro;
}

export interface IListReportStandard extends Omit<IListReport, 'report'> {
  report: ResponseToReport;
  type: ToggleGroup;
  key?: string;
}

export interface IReportisticaState {
  periodo?: string;
  periodoDialog: IPropsChangeLavoro;
  parametriReport?: IParameter[];
  parametri?: string;
  db?: UserStateLock;
  select_report?: TypeSelectReport;
  reportToDialog?: ToggleGroup;
  listNotManaged?: IListReport[];
  listValidata?: IListReport[];
  listNotValid?: IListReport[];
  listNotCertified?: IListReport[];
  listCertified?: IListReport[];
  listAssenti?: IListReport[];
  listValidationNull?: IListReport[];
  listDaRivedere?: IListReport[];
  listIpaMetalli?: IListReport[];
  listStandardReport?: IListReportStandard[];
}

export const initialStateReportistica: IReportisticaState = {
  periodo: undefined,
  parametri: undefined,
  db: 'cop',
  select_report: undefined,
  periodoDialog: {
    dataInizio: '',
    dataFine: ''
  }
}

export const reportisticaReducer = createReducer(
  initStateReportistica,
  on(setDBReportisticaAction, (state, {db}) => ({...state!, db})),
  on(setPeriodoReportisticaAction, (state, {props}) => ({...state!, periodoDialog: {dataInizio: props.dataInizio, dataFine: props.dataFine}})),
  on(selectPeriodoReportisticaAction, (state, {props}) => ({...state!, periodoDialog: {...props}})),
  on(addParametriReportisticaAction, (state, {parametri}) => ({...state!, parametriReport: parametri})),
  on(setReportToInitReportisticaAction, (state, {data}) => ({...state!, select_report: data})),
  on(callReport, (state, {data}) => ({...state!,parametriReport: [], listValidata: [data, ...state?.listValidata ?? []]})),
  on(callReportNotValid, (state, {data}) => ({...state!, listNotValid: [data, ...state?.listNotValid ?? [],]})),
  on(callReportNotCertified, (state, {data}) => ({...state!, listNotCertified: [data, ...state?.listNotCertified ?? [],]})),
  on(callReportNotManaged, (state, {data}) => ({...state!, listNotManaged: [data, ...state?.listNotManaged ?? [],]})),
  on(callReportCertified, (state, {data}) => ({...state!, listCertified: [data, ...state?.listCertified ?? [],]})),
  on(callReportAssenti, (state, {data}) => ({...state!, listAssenti: [data, ...state?.listAssenti ?? [],]})),
  on(callReportValidationNull, (state, {data}) => ({...state!, listValidationNull: [data, ...state?.listValidationNull ?? [],]})),
  on(callReportIpaMetalli, (state, {data}) => ({...state!, listIpaMetalli: [data, ...state?.listIpaMetalli ?? [],]})),
  on(callReportToReview, (state, {data}) => ({...state!, listDaRivedere: [data, ...state?.listDaRivedere ?? [],]})),
  on(newStateREportisticaAction, (state, {state: newState}) => ({...newState})),
  on(selectedReportisticaAction, (state, {data}) => ({
    ...state,
    reportToDialog: data
  })),
  on(reportStandardAction, (state, {data}) => ({
    ...state,
    listStandardReport: [data, ...state?.listStandardReport ?? []]
  }))
);



