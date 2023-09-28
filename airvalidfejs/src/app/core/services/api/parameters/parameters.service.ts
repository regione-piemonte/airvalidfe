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
export class ParametersService {

  constructor(private readonly http: HttpClient) {}


// Restituisce l'elenco dei nomi dei parametri (meteo, inquinanti) misurati e
// presenti nella banca dati
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/parameternames/cop
  getParametersName(): Observable<any> {
    return this.http.get<any>(environment.apiEndpoint+"parameternames/cop");
  }
 


// Restituisce tutti gli oggetti di tipo 'Parameter' presenti nella banca dati
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/parameters/cop
getParameters(): Observable<any> {
  return this.http.get<any>(environment.apiEndpoint+"parameters/cop");
}




}
