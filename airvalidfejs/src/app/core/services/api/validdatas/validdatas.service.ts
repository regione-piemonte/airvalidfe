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
export class ValiddatasService {

  constructor(private readonly http: HttpClient) {}


  // Restituisce le misure presenti nel database per il sensore e il periodo
// specificati, utilizzando un oggetto con numero minimo di campi (timestamp e
// valore_validato).
// Le misure restituite avranno almeno il livello di 'verifica' richiesto
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// {beginDate}: data di inizio del periodo di ricerca delle misure
// "endDate": data di fine del periodo di ricerca delle misure (opzionale)
// "period_m": periodo di aggregazione delle misure (es. 60 minuti, ozionale)
// "verificationLevel": livello minimo di verifica richiesto (opzionale, il
// livello di default è quello massimo)
// Esempio
// https://<server_name>/ariaweb/airvalidsrv/validdata/cop/13.001272.803.21/1669762800000?endDate=1669849200000&period_m=60
getSensorValidData(): Observable<any> {
  return this.http.get<any>(environment.apiEndpoint+"validdata/cop/13.001272.803.21/1669762800000?endDate=1669849200000&period_m=60");
}
}
