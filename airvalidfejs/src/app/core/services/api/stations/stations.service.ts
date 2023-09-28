/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StationsService {


  constructor(private readonly http: HttpClient) {}


 // Restituisce l'elenco dei nomi dei sensori (ovvero parametri misurati) della
// stazione specificata
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {stationId}: identificatore dell'oggetto stazione (come ottenuto nell'elenco
// dei nomi delle stazioni)
// "beginDate": data di inizio del periodo di ricerca delle informazioni
// "endDate": data di fine del periodo di ricerca delle informazioni
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/stations/cop/13.001008.801/sensornames
  getSensorsNameByStation(key:string): Observable<any> {
    let start=localStorage.getItem('startDate')
    let end=localStorage.getItem('endDate')
    return this.http.get<any>(environment.apiEndpoint+"stations/cop/"+key+"/sensornames?beginDate="+start+"&endDate="+end);
  }


// Restituisce l'oggetto con tutte le informazioni relative ad una stazione di
// monitoraggio
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {stationId}: identificatore dell'oggetto stazione
// "beginDate": data di inizio del periodo di ricerca delle informazioni
// "endDate": data di fine del periodo di ricerca delle informazioni
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/stations/cop/13.001008.801
getStationInfo(): Observable<any> {
  return this.http.get<any>(environment.apiEndpoint+"stations/cop/13.001008.801");
}


  
}
