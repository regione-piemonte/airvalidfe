/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, switchAll, switchMap, take, tap } from 'rxjs';
import { environment } from '@environments/environment';
import { Parametri } from "@models/validazione";
import { LocalService } from "@services/core/locale/local.service";
import { UserStateLock } from "@services/core/api";
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/state';
import { reportSelezionatoElaborazioneSelector } from '@selectors/*';

@Injectable({
  providedIn: 'root'
})
export class StationsService {


  constructor(
    private readonly http: HttpClient,
    private readonly localService: LocalService,
    private readonly store: Store<AppState>
  ) {
  }


  // Restituisce l'elenco dei nomi dei sensori (ovvero parametri misurati) della
  // stazione specificata
  // {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
  // {stationId}: identificatore dell'oggetto stazione (come ottenuto nell'elenco
  // dei nomi delle stazioni)
  // "beginDate": data di inizio del periodo di ricerca delle informazioni
  // "endDate": data di fine del periodo di ricerca delle informazioni
  // Esempio:
  // https://<server_name>/ariaweb/airvalidsrv/stations/cop/13.001008.801/sensornames
  getSensorsNameByStation(key: string, db: UserStateLock = 'cop'): Observable<Array<Parametri>> {
    return this.store.select(reportSelezionatoElaborazioneSelector).pipe(
      take(1),
      switchMap((resp) => {
        return this.localService.getDataWithDataStore((start, end) => {
          let params = new HttpParams();
          params = params.append('beginDate', start);
          params = params.append('endDate', end);
          if (resp && resp.value?.includes('ipametalli')) {
            params = params.append('ipaFilter', 'true')
          }
          return this.http.get<Array<Parametri>>(`${environment.apiEndpoint}stations/${db}/${key}/sensornames`, { params })
        })
    }))
  }


  // Restituisce l'oggetto con tutte le informazioni relative ad una stazione di
  // monitoraggio
  // {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
  // {stationId}: identificatore dell'oggetto stazione
  // "beginDate": data di inizio del periodo di ricerca delle informazioni
  // "endDate": data di fine del periodo di ricerca delle informazioni
  // Esempio:
  // https://<server_name>/ariaweb/airvalidsrv/stations/cop/13.001008.801
  // getStationInfo(): Observable<any> {
  //  return this.http.get<any>(environment.apiEndpoint + "stations/cop/13.001008.801");
  //}


}
