/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DatatimestampsService {

  constructor(private readonly http: HttpClient) {}


// Restituisce l'elenco dei timestamp delle misure presenti nella banca dati che
// non hanno il flag di certificazione impostato.
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// {beginDate}: data di inizio del periodo di ricerca delle misure
// {endDate}: data di fine del periodo di ricerca delle misure
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/datatimestamps/notcertified/cop/13.001272.803.21/1669762800000/1669849200000

  getMeasureNotCertifiedTimestamps(): Observable<any> {
    return this.http.get<any>(environment.apiEndpoint+"datatimestamps/notcertified/cop/13.001272.803.21/1669762800000/1669849200000");
  }


// Restituisce l'elenco dei timestamp delle misure presenti nella banca dati che
// hanno il flag 'da rivedere' impostato a 'true' per il sensore e periodo
// specificati
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// {beginDate}: data di inizio del periodo di ricerca delle misure
// {endDate}: data di fine del periodo di ricerca delle misure
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/datatimestamps/toreview/cop/13.001272.803.21/1669762800000/1669849200000
getMeasureReviewTimestamps(): Observable<any> {
  return this.http.get<any>(environment.apiEndpoint+"datatimestamps/toreview/cop/13.001272.803.21/1669762800000/1669849200000");
}

// Restituisce l'elenco dei timestamp delle misure presenti nella banca dati che
// non sono ancora state validate per il sensore e periodo specificati
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// {beginDate}: data di inizio del periodo di ricerca delle misure
// {endDate}: data di fine del periodo di ricerca delle misure
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/datatimestamps/notvalidated/cop/13.001272.803.21/1669762800000/1669849200000
getMeasureNotValidatedTimestamps(): Observable<any> {
  return this.http.get<any>(environment.apiEndpoint+"datatimestamps/notvalidated/cop/13.001272.803.21/1669762800000/1669849200000");
}


// Restituisce l'elenco dei timestamp delle misure presenti nella banca dati che
// sono state validate come valide pur avendo il valore_validato impostato a
// null, per il sensore e periodo specificati
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// {beginDate}: data di inizio del periodo di ricerca delle misure
// {endDate}: data di fine del periodo di ricerca delle misure
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/datatimestamps/validnovalue/cop/13.001272.803.21/1669762800000/1669849200000
getMeasureValidNoValueTimestamps(): Observable<any> {
  return this.http.get<any>(environment.apiEndpoint+"datatimestamps/validnovalue/cop/13.001272.803.21/1669762800000/1669849200000");
}


// Restituisce l'elenco dei timestamp delle misure che non sono presenti nella
// banca dati (nemmeno come dato di tipo mancante) per il sensore e periodo
// specificati
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// {beginDate}: data di inizio del periodo di ricerca delle misure
// {endDate}: data di fine del periodo di ricerca delle misure
// {period_m}: periodo di aggregazione delle misure
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/datatimestamps/notcompleted/cop/13.001272.803.21/1669762800000/1669849200000/60
getMeasureNotCompletedTimestamps(): Observable<any> {
  return this.http.get<any>(environment.apiEndpoint+"datatimestamps/notcompleted/cop/13.001272.803.21/1669762800000/1669849200000/60");
}




}
