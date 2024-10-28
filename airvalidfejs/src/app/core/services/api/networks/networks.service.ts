/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {forkJoin, map, Observable, switchMap} from 'rxjs';
import {environment} from '@environments/environment';
import {StationName} from '@models/response/dettaglio-config-param';
import {AreeTerritoriali} from "@models/validazione";
import {LocalService} from "@services/core/locale/local.service";

@Injectable({
  providedIn: 'root'
})
export class NetworksService {

  constructor(private readonly http: HttpClient, private readonly localService: LocalService) {
  }


  // Restituisce l'oggetto con tutte le informazioni relative ad una rete di
// monitoraggio
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {netId}: identificatore dell'oggetto rete (come ottenuto nell'elenco dei nomi
// delle reti)
// "beginDate": data di inizio del periodo di ricerca delle informazioni
// "endDate": data di fine del periodo di ricerca delle informazioni
  getNetwork(): Observable<any> {
    return this.http.get<any>(environment.apiEndpoint + "networks/cop/13");
  }


// Restituisce l'elenco dei nomi delle reti di monitoraggio
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// "beginDate": data di inizio del periodo di ricerca delle informazioni
// "endDate": data di fine del periodo di ricerca delle informazioni
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/networknames/cop
  getNetworksName(db: 'cop' | 'reg' = "cop"): Observable<Array<AreeTerritoriali>> {
    return this.localService.getDataWithDataStore((start, end) => this.http.get<Array<AreeTerritoriali>>(`${environment.apiEndpoint}networknames/${db}?beginDate=${start}&endDate=${end}`).pipe(
          map((aree) => aree.sort(({name}, {name: nameSeconda}) => (name < nameSeconda ? -1 : 1)))
        )
    )
  }


// Restituisce l'elenco dei nomi delle stazioni appartenenti ad una rete di
// monitoraggio
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {netId}: identificatore dell'oggetto rete
// "beginDate": data di inizio del periodo di ricerca delle informazioni
// "endDate": data di fine del periodo di ricerca delle informazioni
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/networks/cop/13/stationnames
  getStationsNameByNetwork(key: string, db: 'cop'|'reg' = 'cop'): Observable<StationName[]> {
    return this.localService.getDataWithDataStore((start, end) => this.http.get<StationName[]>(`${environment.apiEndpoint}networks/${db}/${key}/stationnames?beginDate=${start}&endDate=${end}`)).pipe(
          map((stazione) => stazione.sort(({name}, {name: nameSeconda}) => (name < nameSeconda ? -1 : 1)))
      );
  }

  /**
   * Generates a list of station names from an array of observables.
   *
   * @param {Observable<StationName[]>[]} lista - An array of observables containing station names.
   * @returns {Observable<StationName[]>} - An observable of the sorted list of station names.
   */
  generaListStazioni(lista: Observable<StationName[]>[]): Observable<StationName[]> {
    return forkJoin(lista).pipe(
      map((data) =>
        data.reduce((result, arr) => [...result, ...arr], [])
      ),
      map((el) => el.sort((a, b) => (a.name < b.name ? -1 : 1)))
    );
  }


}
