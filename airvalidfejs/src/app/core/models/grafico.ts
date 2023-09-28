/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { IParameter } from './dataService';
import { ITimeSelected } from '../../shared/components/validazione-dettaglio/models/time-selected.model';

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
  dataset: Dataset[],
  index: number,
  parameter: Partial<IParameter>
}
