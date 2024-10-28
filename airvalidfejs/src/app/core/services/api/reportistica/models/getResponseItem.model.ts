/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */

export interface Item {
  name: string;
  key: string;
  active: boolean;
  extraInfo: string;
  flags: string;
  beginDate: number;
  endDate: number | null;
  keys?: string[];
}


export interface IResponseItems {
  itemType: keyof typeof ItemTypeSpecialistico;
  countMin: number;
  countMax: number | null;
  selectionCompleted: boolean;
  items: Item [];
  itemsKeys: Item[];
}

export interface IResponseReportElaborazione {
  reportID:          string;
  reportName:        string;
  reportDescription: string;
  timeBase:          string;
  plotType:          string;
  dataSeries:        DataSery[];
  uuid: string;
}

export interface DataSery {
  id:          string;
  name:        string;
  measureUnit: string;
  numDecimals: number;
  values:      Value[];
}

export interface Value {
  timestamp: number;
  value:     number | null;
}

export enum ItemTypeSpecialistico {
  NETWORK = 'netWork',
  SENSOR = 'sensor',
  STATION = 'station',
  PARAMETER = 'parametri',

}

