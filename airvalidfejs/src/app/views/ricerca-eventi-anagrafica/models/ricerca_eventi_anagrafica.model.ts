/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {UserStateLock} from "@services/core/api";

export type RicercaEventiAnagraficaType= UserStateLock & 'eventi';

export interface IEventiAnagraficaResponse {
  begin:   number;
  count:   number;
  total:   number;
  filters: Filter[];
  items:   IListTerritorialItem[];
}

export interface Filter {
  id:    string;
  items: FilterItem[];
}

export interface FilterItem {
  name:  string;
  count: number;
  active?: boolean;
}

export interface IListTerritorialItem extends IEvent{
  title:         string;
  beginDate:     Date;
  endDate?:       Date;
  address:       string;
  mapsUrl:       string;
  altitude:      number;
  stationType:   string;
  stationUrl:    string;
  national:      boolean;
  publicOwned:   boolean;
  publicManaged: boolean;
  toBePublisched: boolean;

}

export interface IResponseEventiAnagraficaResponse {
  begin:   number;
  count:   number;
  total:   number;
  filters: Filter[];
  items:   IEvent[];
}

export interface Filter {
  id:    string;
  items: FilterItem[];
}

export interface FilterItem {
  name:  string;
  count: number;
}

export interface IEvent {
  stationId:   string;
  networkName: string;
  stationName: string;
  sensorId:    string;
  sensorName:  string;
  event:       Event;
}

export interface Event {
  origin:    string;
  type:      string;
  beginDate: number;
  endDate:   number;
  notes:     string[];
}
