/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {IGetStatusLock} from "@models/interface/BE/response/getLock";

export interface IData {
  selected: SelectedStatus
  all: Parametri[]
}

export interface Selected {
  areeTerritoriali: AreeTerritoriali[];
  stazioni: Stazioni[];
  parametri: Parametri[];
}

export interface IStatus {
  statusLock: IGetStatusLock;
  index: number;
}

export interface SelectedStatus extends Selected {
  status?: Array<IStatus>
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
  active: boolean;
  beginDate: number;
  correctionSupported: boolean;
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
  active: boolean
  beginDate: number
  correctionSupported: boolean
  decimalDigits: number
  endDate: any
  extraInfo: string
  flags: any
  key: string
  measureUnitId: string
  measurementPeriod: number
  name: string
}

export interface IFormatExport {
  dataFormat: string;
  dataSeparator: string;
  numberSeparator: string;
  type: string;
  typeFormatCsv?: 'normal' | 'list';
}

export interface IConfigDialogParameter {
  id: number;
  title: string;
  data?: IFormatExport;
}
