/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {environment} from "@environments/environment";
import {UserStateLock} from "@services/core/api";
import {LocalService} from "@services/core/locale/local.service";
import {IPropsFilter} from "@dialog/*";
import {catchError, of} from "rxjs";

export interface IResponseSuggest {
  name: string;
  key: string;
  active: boolean;
  extraInfo?: string;
  flags?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RicercaSuggestService {

  constructor(
    readonly http: HttpClient,
    readonly localService: LocalService,
  ) { }

  getParamiters(text: string, props:{db?: UserStateLock, stationIds?: Array<string>, filtri: Partial<IPropsFilter>}) {
    let params = new HttpParams();
    let {db = 'cop', stationIds = [], filtri} = props;
    stationIds!.forEach(key => params = params.append('sIds', key));
    for (const filtriKey in filtri) {
      // @ts-ignore
    if (filtri[filtriKey] !== null && filtri[filtriKey] !== undefined) {
        // @ts-ignore
        params = params.append(`${filtriKey}`, filtri[filtriKey]);
      }
    }

    return this.localService.getDataWithDataStore((start, end) => {
      params = params.append('beginDate', start);
      params = params.append('endDate', end);
      return this.http.get<IResponseSuggest[]>(`${environment.apiEndpoint}/suggest/parameternames/${db}/${text}*`,{params}).pipe(
        catchError(err => of([] as IResponseSuggest[]))
      )
    })
  }

  getStations(text: string, props:{db?: UserStateLock, parameterIds?: Array<string>, filtri: Partial<IPropsFilter>}) {
    let params = new HttpParams();
    let {db = 'cop', parameterIds = [], filtri} = props;
    parameterIds!.forEach(key => params = params.append('pIds', key));
    for (const filtriKey in filtri) {
      // @ts-ignore
      if (filtri[filtriKey] !== null && filtri[filtriKey] !== undefined) {
        // @ts-ignore
        params = params.append(`${filtriKey}`, filtri[filtriKey]);
      }
    }

    return this.localService.getDataWithDataStore((start, end) => {
      params = params.append('beginDate', start);
      params = params.append('endDate', end);
      return this.http.get<IResponseSuggest[]>(`${environment.apiEndpoint}/suggest/stationnames/${db}/${text}*`,{params}).pipe(
        catchError(err => of([] as IResponseSuggest[]))
      )
    });
  }


}
