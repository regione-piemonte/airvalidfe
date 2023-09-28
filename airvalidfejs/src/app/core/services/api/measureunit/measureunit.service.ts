/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MeasureunitService {
  constructor(private readonly http: HttpClient) {}

  // Restituisce l'elenco dei nomi delle unità di misura presenti nella banca dati
  // nel campo extraInfo viene resa disponibile la sigla html dell'unità di misura
  // {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
  getMeasureUnitList(): Observable<any> {
    return this.http.get<any>(environment.apiEndpoint + 'measureunitnames/cop');
  }

  // Restituisce l'elenco dei codici di validazione presenti nella banca dati:
    // il campo 'code' contiene il codice di validazione
    // il campo 'description' contiene la descrizione
    // {dbId}: identificatore del data base cop=Arpa per validazione
    // Esempio:
    // https://<server_name>/ariaweb/airvalidsrv/measureunitnames/cop
   // @GET
    //@Produces(MediaType.APPLICATION_JSON)
    //@Path("/validationcodes/{dbId}")
    getMeasureCodeNameList(): Observable<any> {
      return this.http.get<any>(environment.apiEndpoint + 'validationcodes/cop');
    }
}
