/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
export interface ObservableData {
  parameter: IParameter
  index: number
}

export interface IParameter {
  color: string;
  visible: boolean;
  visibleOrigin: boolean;
  visibleNotValid: boolean;
  locked: boolean;
  userLock: string;
  stazione: Stazione;
  area: Area;
  parametro: Parametro;
  selected?: boolean;
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
