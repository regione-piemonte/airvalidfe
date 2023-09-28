/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IDettaglioConfigParam } from '../../../models/response/dettaglio-config-param';

@Injectable({
  providedIn: 'root'
})
export class NetworksService {

 constructor(private readonly http: HttpClient) {}


 // Restituisce l'oggetto con tutte le informazioni relative ad una rete di
// monitoraggio
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {netId}: identificatore dell'oggetto rete (come ottenuto nell'elenco dei nomi
// delle reti)
// "beginDate": data di inizio del periodo di ricerca delle informazioni
// "endDate": data di fine del periodo di ricerca delle informazioni
 getNetwork(): Observable<any> {
   return this.http.get<any>(environment.apiEndpoint+"networks/cop/13");
 }


// Restituisce l'elenco dei nomi delle reti di monitoraggio
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// "beginDate": data di inizio del periodo di ricerca delle informazioni
// "endDate": data di fine del periodo di ricerca delle informazioni
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/networknames/cop
getNetworksName(): Observable<any> {
  let start=localStorage.getItem('startDate')
  let end=localStorage.getItem('endDate')
  return this.http.get<any>(environment.apiEndpoint+"networknames/cop?beginDate="+start+"&endDate="+end).pipe(
    map((el)=>el.sort((a:any,b:any)=>(a.name<b.name?-1:1)))
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
getStationsNameByNetwork(key:number): Observable<IDettaglioConfigParam[]> {
  let start=localStorage.getItem('startDate')
  let end=localStorage.getItem('endDate')
  return this.http.get<IDettaglioConfigParam[]>(environment.apiEndpoint+"networks/cop/"+key+"/stationnames?beginDate="+start+"&endDate="+end);
}


}
