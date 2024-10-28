/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { IParameter } from './dataService';
import { ITimeSelected } from '@components/shared/validazione-dettaglio/models/time-selected.model';
import {IGeneratePoint, ScaleEnum} from "@components/shared/grafico/compositive_grafic/models";

export interface IGrafico {
  area: Area;
  parametro: Parametro;
  stazione: Stazione;
  visible: boolean;
  visibleOrigin: boolean;
  visibleNotValid: boolean;
  locked: boolean;
  userLock: string;
  color: string;
  name: string;
  dataset: Dataset[];
  taratura?: Array<ITaratura>;
  key: string;
}

export interface ITaratura {
  codice_istat_comune: string;
  progr_punto_com: number;
  id_parametro: string;
  ticketId: string;
  instrumentId: string;
  beginDate: number;
  endDate: number;
  yearly: boolean;
  zero: number;
  span: number;
  cylinderConcentration: number;
  converterEfficiency: unknown;
  timeFound: boolean;
  calibrationApplied:    boolean;

}


export interface Area {
  name: string
  key: string
  active: boolean
  extraInfo: string
  flags: string
  beginDate: number
  endDate: any
}

export interface Parametro {
  name: string
  key: string
  active: boolean
  extraInfo: string
  flags: any
  beginDate: number
  endDate: any
  measureUnitId: string
  measurementPeriod: number
  decimalDigits: number
}

export interface Stazione {
  name: string
  key: string
  active: boolean
  extraInfo: string
  flags: any
  beginDate: number
  endDate: any
}

export interface Dataset extends ITimeSelected {
}


export interface IOutput {
  dataset: Dataset[];
  index: number;
  parameter: Partial<IParameter>;
  // mi serve per inserire i valori modificati nel dettaglio
  changedDataset?: Dataset[];
}

export type TypeScale = {
  fondoScala?: string;
  minFondoScala?: string;
  oldScale: ScaleEnum;
}

export type TypeUnion = {
  name?: string
};


export interface IProcessData {
  dataIndex: Array<Dataset>;
  parametro: IParameter;
  dataSeries: Partial<IGeneratePoint>[];
  min: number;
  max: number;
  after?: boolean;
  decimal: number;
}

export interface IIndexStartEnd {
  lunghezza: number;
  indexStart: number;
  indexEnd: number;
  indiceGrafico: number;
}

export type extractedIndexStartEndParamsType<T> = T & { start: number, end: number, batch: Array<{ startValue: number, endValue: number }> };
