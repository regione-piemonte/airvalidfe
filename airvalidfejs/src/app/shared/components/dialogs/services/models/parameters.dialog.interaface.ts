/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Parametro , Stazione } from '../../../../../core/models/dataService';

export interface IModdelParametersDialog {
  selected: Selected
  all: Parametro[]
}

export interface Selected {
  areeTerritoriali: AreeTerritoriali[]
  stazioni: Stazione[]
  parametri: Parametri[]
}

export interface AreeTerritoriali {
  name: string
  key: string
  active: boolean
  extraInfo: string
  flags: string
  beginDate: number
  endDate: any
}

export interface Stazioni {
  name: string
  key: string
  active: boolean
  extraInfo: string
  flags: any
  beginDate: number
  endDate: any
}

export interface Parametri {
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

export interface All {
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
