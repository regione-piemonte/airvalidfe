/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {FilterItem, IEventiAnagraficaResponse} from "@views/ricerca-eventi-anagrafica/models/ricerca_eventi_anagrafica.model";
import {environment} from "@environments/environment";
import {IFormRicercaEventi} from "@views/ricerca-eventi-anagrafica/form-ricerca-eventi/form-ricerca-eventi.component";
import {DateSettingService} from "@services/core/utility/date-setting.service";


export interface IPropsPaginazione {
  count?: number;
  begin?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RicercaAnagraficaEventiService {


  constructor(
    private http: HttpClient,
    private readonly dateSetting: DateSettingService,
  ) {
  }

  getRicercaAnagrafica({startDate, endDate, typeSelect, textInput, count = 10, begin = 0}: IFormRicercaEventi & IPropsPaginazione, filtri?: Array<FilterItem & {id: string}>) {
    let params = new HttpParams();
    // Aggiungo la paginazione
    params = params.append('count', count.toString());
    params = params.append('begin', begin.toString());
    if (startDate && endDate) {
      // trasformo le date in millisecondi
      let {dayUTC, monthUTC, hoursUTC, yearUTC, secondsUTC} = this.dateSetting.convertToUTC(startDate);
      let {dayUTC: dayEnd, monthUTC: monthEnd, hoursUTC: hoursEnd, yearUTC: yearsEnd, secondsUTC: secondEnd} = this.dateSetting.convertToUTC(endDate);
      params = params.append('beginDate', Date.UTC(yearUTC, monthUTC, dayUTC, 0, 0).toString());
      params = params.append('endDate', Date.UTC(yearsEnd, monthEnd, dayEnd, 0,0).toString());
    }
    if (filtri) {
      for (const {id, name} of filtri) {
        params = params.append(id, name);
      }

    }

    if (typeSelect === 'events') {
      return this.http.get<IEventiAnagraficaResponse>(`${environment.apiEndpoint}/events/reg/${textInput}*`, {params})
    }
    return this.http.get<IEventiAnagraficaResponse>(`${environment.apiEndpoint}/anagraph/${typeSelect}/${textInput}*`, {params})
  }
}
