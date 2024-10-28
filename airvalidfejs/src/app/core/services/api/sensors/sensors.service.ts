/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin , iif , Observable , of , switchMap } from 'rxjs';
import { environment } from '@environments/environment';
import { IDettaglioConfigParam } from '@models/response/dettaglio-config-param';

export interface ISensoriCorrelati {
  codice_istat_comune: string;
  id_parametro: string;
  id_rete_monit: string;
  progr_punto_com: number;
}

@Injectable({
  providedIn: 'root'
})
export class SensorsService {

  constructor(private readonly http: HttpClient) {}


// Restituisce l'oggetto con tutte le informazioni relative ad un sensore
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// "beginDate": data di inizio del periodo di ricerca delle informazioni
// "endDate": data di fine del periodo di ricerca delle informazioni
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/sensors/cop/13.001008.801.21
   getSensorInfo(): Observable<any> {
     return this.http.get<any>(environment.apiEndpoint+"sensors/cop/13.001008.801.21");
   }

// Restituisce un oggetto con le informazioni di sintesi di rete, stazione e
	// sensore
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/sensors/contextinfo/cop/13.001008.801.21
	//@GET
	//@Produces(MediaType.APPLICATION_JSON)
	//@Path("/sensors/contextinfo/{dbId}/{sensorId}")
  getSensorDetail(sensorKey:string): Observable<IDettaglioConfigParam> {
    return this.http.get<IDettaglioConfigParam>(environment.apiEndpoint+"sensors/contextinfo/cop/"+sensorKey);
  }

  /**
   * @description Restituisce l'elenco dei sensori correlati con quello passato come argomento
   * @param {string} dbId identificatore del data base reg=regionale
   * @param {string} sensorId 'identificatore dell'oggetto sensore'
   * @returns {Observable<any>}
   * @example
   * https://<server_name>/ariaweb/airvalidsrv/sensors/related/{dbId}/{sensorId}
   */
  getSensoriCorrelati( sensorId: string, dbId: 'reg' = 'reg' ): Observable<IDettaglioConfigParam[]> {
    return this.http.get<ISensoriCorrelati[]>( environment.apiEndpoint + "sensors/related/" + dbId + "/" + sensorId ).pipe(
      switchMap( ( res ) =>
        iif( () => res.length === 0,
        of([]) ,
        this.getAllSensors(res) ) ,
      )
    )
      ;
  }

  getAllSensors(lista: ISensoriCorrelati[]): Observable<IDettaglioConfigParam[]> {
    let lista$ = lista.map( ( {codice_istat_comune, progr_punto_com, id_parametro, id_rete_monit} ) => {
      let key =`${id_rete_monit}.${codice_istat_comune}.${progr_punto_com}.${id_parametro}`;
      return this.getSensorDetail( key );
    });
    return forkJoin(lista$);
  }
}
