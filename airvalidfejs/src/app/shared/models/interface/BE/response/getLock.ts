/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Parametro} from "@models/dataService";

export interface IGetStatusLock {
  measurementID: string;
  year:          number;
  userID:        string;
  userInfo:      string;
  date:          number;
  locked:        boolean;
  myLock:        boolean;
  measurementId?: string;
  userId?:        string;
}

/**
* @description Response del servizio lock
*/
export interface IResponseLock {
  "measurementId": string;
  "beginYear":     number;
  "endYear":       number;
  "userId":        string;
  "userInfo":      string;
  "contextId":     string;
  "date":          number;
  "locked":        boolean;
  "myLock":        boolean;
}

export interface IResponseLockWithName extends Partial<IResponseLock> {
  name?: string;
  parametro?: Parametro
}
