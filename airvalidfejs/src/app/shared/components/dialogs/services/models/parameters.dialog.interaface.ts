/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Parametro  } from '@models/dataService';
import {Parametri, Stazioni} from "@models/validazione";

export interface IModdelParametersDialog {
  selected: Selected
  all: Parametro[]
}

export interface Selected {
  areeTerritoriali: AreeTerritoriali[]
  stazioni: Stazioni[]
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

export interface StazioniOld {
  name: string
  key: string
  active: boolean
  extraInfo: string
  flags: any
  beginDate: number
  endDate: any
}

export interface ParametriOld {
  active: boolean;
  beginDate: number;
  correctionSupported?: boolean
  decimalDigits: number;
  endDate: any;
  extraInfo: string;
  flags: any;
  key: string;
  measureUnitId: string;
  measurementPeriod: number;
  name: string;
  virtual?: boolean;
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
