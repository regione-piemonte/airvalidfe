/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {UserStateLock} from "@services/core/api";
import {ITabelleParams} from "@components/shared/dialogs/reportistica-standard/model/standard.model";

export default interface IResponseReportistica {
   id?: string;
   description?: string;
   listResult?: ListResult[];
   name?: string;
   unitaMisura?: string;
}

export interface IResponseReportisticaValues extends Omit<IResponseReportistica, 'listResult'> {
  listResult?: Array<Values>
}

export interface ListResult {
   id?: string;
   description?: string;
   timebase?: string;
   plotType?: string;
   values?: Values[];
   name?: string;
}

export interface Values {
   timestamp?: number;
   value?: number;
   error?: number;
}

export type TypeOfValidataRepost = { timestamp: number, valore_validato?: number };

 export interface IPeriodoService {
  sensorId: string;
  startDate: string;
  endDate: string;
  period_m: string;
  verificationLevel?: string;
}

export type test<T> = T extends Array<number> ? Array<number> : Array<TypeOfValidataRepost>;


export interface IPropsElaborazioni {
  type: string;
  dbId: UserStateLock;
  sensorId: string;
  beginDate: string;
  endDate: string;
  period_m: string;
  verificationLevel?: string;
  decimalDigits?: string;
}

export type ElaborazioniReportType = 'daily' | 'variable' | 'yearly';

export interface IParamsToReport {
  date?: string;
  anno?: string;
  beginDate?: string;
  endDate?: string;
  validatedDataOnly?: boolean;
  sensorIds: Array<string>;
  displayColors: boolean;
  displayNetNames: boolean;
  anagraphInfoByRows: boolean;
  tableIds?: ITabelleParams;
}
