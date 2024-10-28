/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {createAction} from "@ngrx/store";
import {UserStateLock} from "@services/core/api";
import {IListReport, IListReportStandard, IReportisticaState, TypeSelectReport} from "../reducer";
import {IPropsChangeLavoro} from "./dialog.action";
import {IParameter} from "@models/dataService";
import {TypeRecords} from "@components/shared/dialogs/dialog-remove-report/dialog-remove-report.component"
import {ToggleGroup} from "@dialog/*";

export const setDBReportisticaAction = createAction('[Reportistica] Set DB', (db: UserStateLock) => ({db}));

export const setPeriodoReportisticaAction = createAction('[Reportistica] Set Periodo', (props: IPropsChangeLavoro) => ({props}));

export const selectPeriodoReportisticaAction = createAction('[Reportistica] Select Periodo', (props: IPropsChangeLavoro) => ({props}))

export const addParametriReportisticaAction = createAction('[Reportistica] Add parametri selezionati', (parametri: IParameter[]) => ({parametri}))

/**
 * @description Rimoizione dalla lista di reportistica dopo chiusura modal
 */
export const deleteReportAction = createAction('[Parametri] Delete Report', (records: TypeRecords) => ({records}));

/**
 * @description Selezione della reportistica dopo chiusura modal
 */
export const callReportToDialogAction = createAction('[Reportistica] Set report selezionato', (data: TypeSelectReport) => ({data}));

export const callReportStandardAction = createAction('[Reportistica] call report standard', (data: ToggleGroup) => ({data}));

export const reportStandardAction = createAction('[Reportistica] Ricevo report Standard', (data: IListReportStandard) => ({data}));

// export type IResponseAllValidata = Array<{ data: Array<TypeOfValidataRepost>, parametro: string }>;
/**
 * @description Risultato del servizio per la chiamata del repoort quando non è state gestita
 */
export const callReportNotManaged = createAction('[Reportistica] Call Report Not Managed', (data: IListReport) => ({data}));
/**
 * @description Risultato del servizio per la chiamata del report
 */
export const callReport = createAction('[Reportistica] Call Report', (data: IListReport) => ({data}));

/**
 * @description Risultato del servizio per la chiamata del report Not Certified
 */
export const callReportNotValid = createAction('[Reportistica] Call Report Not Valid', (data: IListReport) => ({data}));

/**
 * @description Risultato del servizio per la chiamata del report Not Certified
 */
export const callReportNotCertified = createAction('[Reportistica] Call Report Not Certified', (data: IListReport) => ({data}));

/**
 * @description Risultato del servizio per la chiamata del report Certificates
 */
export const callReportCertified = createAction('[Reportistica] Call Report Certified', (data: IListReport) => ({data}));

/**
 * @description Risultato del servizio per la chiamata del report Assenti
 */
export const callReportAssenti = createAction('[Reportistica] Call Report Assenti', (data: IListReport) => ({data}));

/**
 * @description Risultato del servizio per la chiamata del report IPA metalli
 */
export const callReportIpaMetalli = createAction('[Reportistica] Call Report IPA Metalli', (data: IListReport) => ({data}));

/**
 * @description Risultato del servizio per la chiamata del report Validation Null
 */
export const callReportValidationNull = createAction('[Reportistica] Call Report Validation Null', (data: IListReport) => ({data}));

export const callReportToReview = createAction('[Reportistica] Call Report To Review', (data: IListReport) => ({data}));

export const newStateREportisticaAction = createAction('[Reportistica] Cambio lo state con i nuovi record', (state: IReportisticaState) => ({state}));

export const initReportisticaAction = createAction('[Reportisitca] Init Componente Reportistica');

export const setReportToInitReportisticaAction = createAction('[Reportistica] Set report to init', (data: TypeSelectReport) => ({data}));

export const selectedReportisticaAction = createAction('[Reportistica] Set reportistica da dialog', (data: ToggleGroup) => ({data}));

export const deleteSpecialisticoAction = createAction('[Reportistica] Delete Specialistico');

export const addProgressReportisticaAction = createAction('[Reportistica] Add report value', (report:number) => ({report}));
