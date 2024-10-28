/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import {UserStateLock} from "@services/core/api/datalocks/datalocks.service";
import {HttpClient} from "@angular/common/http";
import {environment} from '@environments/environment';
import {Observable} from "rxjs";
import IGetEventsResponse from '@models/eventi/getEvents'


@Injectable({
  providedIn: 'root'
})
export class EventiService {

  constructor(
    private readonly http: HttpClient
  ) { }

  // Restituisce l'elenco degli eventi relativi ad un dato sensore nel periodo specificato
  // {dbId}: identificatore del data base reg=regionale
  // {sensorId}: identificatore del sensore
  // {beginDate}: data di inizio del periodo di ricerca
  // {endDate}": data di fine del periodo di ricerca
  // Nota: la funzione restituisce al massimo 1024 eventi
  // Gli oggetti dell'elenco restituito hanno i seguenti campi:
  // "origin": fonte dell'evento, es: ticket, note
  // "type": eventuale tipologia dell'evento (vale null se l'informazione non c'è)
  // "beginDate": timestamp di inizio dell'evento, in millisecondi
  // "endDate": timestamp di fine dell'evento, in millisecondi
  // "notes": elenco di stringhe con le note dell'intervento (può essere vuoto)
  // Esempio:
  // https://<server_name>/ariaweb/airvalidsrv/sensorevents/reg/22.004078.800.05/1662933600000/1664575200000
  searchEvent( idParametro: string, {start, end}: { start: number; end: number; }, idDb: UserStateLock = 'reg',): Observable<Array<IGetEventsResponse>> {
    return this.http.get<Array<IGetEventsResponse>>(`${environment.apiEndpoint}sensorevents/${idDb}/${idParametro}/${start}/${end}`)
  }
}
