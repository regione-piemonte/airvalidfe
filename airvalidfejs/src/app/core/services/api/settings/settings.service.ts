/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IDettaglioReg } from '../../../models/response/dettaglio-Reg.models';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {


  constructor(private readonly http: HttpClient) {}
// Legge la lista delle configurazioni degli insiemi di sensori selezionati per
// l'utente corrente
// Attualmente questo tipo di configurazione può essere memorizzato solo nella
// banca dati regionale
// {dbId}: identificatore del data base reg=regionale
// https://<server_name>/ariaweb/airvalidsrv/datasetconfignames/reg
// valore restituito:
// La lista dei nomi delle configurazioni salvate
//@GET
//@Produces(MediaType.APPLICATION_JSON)
//@Path("/datasetconfignames/{dbId}")
getConfigList(): Observable<Array<string>> {
  //return this.http.get<any>(environment.apiEndpoint+"datasetconfigs/reg/pluto");
  return this.http.get<Array<string>>(environment.apiEndpoint+"datasetconfignames/reg");
}



// Legge la lista delle configurazioni degli insiemi di sensori selezionati per
// l'utente corrente
// Attualmente questo tipo di configurazione può essere memorizzato solo nella
// banca dati regionale
// {dbId}: identificatore del data base reg=regionale
// https://<server_name>/ariaweb/airvalidsrv/datasetconfignames/reg
// valore restituito:
// La lista dei nomi delle configurazioni salvate
//@GET
//@Produces(MediaType.APPLICATION_JSON)
//@Path("/datasetconfignames/{dbId}")
getPreferencesList(): Observable<any> {
  //return this.http.get<any>(environment.apiEndpoint+"datasetconfigs/reg/pluto");
  return this.http.get<any>(environment.apiEndpoint+"preferences/reg");
}


// Legge la configurazione dell'insieme di sensori selezionati col nome dato per
// l'utente corrente
// Attualmente questo tipo di configurazione può essere memorizzato solo nella
// banca dati regionale
// {dbId}: identificatore del data base reg=regionale
// {name}: nome della configurazione da leggere
// https://<server_name>/ariaweb/airvalidsrv/datasetconfigs/reg/prova
// valore restituito:
// L'oggetto Json contenente la configurazione, i campi sono:
// - "listSensorId": lista di identificatori dei sensori, nel formato usato
// dalle altre funzioni del webservice
// - "timeUnit": (opzionale)
// - ____ TIMESTAMP (per date assolute espresse in millisecondi)
// - ____ DAY (per date relative, in numero di giorni dal giorno corrente)
// - ____ WEEK (per date relative, in numero di settimane dal giorno corrente)
// - ____ MONTH (per date relative, in numero di mesi dal giorno corrente)
// - ____ YEAR (per date relative, in numero di anni dal giorno corrente)
// - ____ per le date in formato relativo usare numeri negativi per andare nel
// ______ passato, es: beginTime=-3, endTime=-1 per selezionare il periodo che
// ______ va da 3 giorni prima di oggi a ieri
// - "beginTime": (opzionale) inizo dell'intervallo temporale
// - "endTime": (opzionale) fine dell'intervallo temporale
// - "activityType": (opzionale) tipo di attività es: validazione, export...
// - "activityOptions": (opzionale) opzioni del tipo di attività
//@GET
//@Produces(MediaType.APPLICATION_JSON)
//@Path("/datasetconfigs/{dbId}/{name}")
  deleteConfig(value: string): Observable<IDettaglioReg> {
    return this.http.delete<IDettaglioReg>(`${ environment.apiEndpoint }datasetconfigs/reg/${ value }`);
    // return this.http.get<any>(environment.apiEndpoint+"preferences/reg");
  }

// Cancella la configurazione dell'insieme di sensori selezionati col nome dato
// per l'utente corrente
// Attualmente questo tipo di configurazione può essere memorizzato solo nella
// banca dati regionale
// {dbId}: identificatore del data base reg=regionale
// {name}: nome della configurazione da cancellare
// https://<server_name>/ariaweb/airvalidsrv/datasetconfigs/reg/prova
// valore restituito:
// numero di oggetti cancellati dalla banca dati
//@DELETE
//@Produces(MediaType.APPLICATION_JSON)
//@Path("/datasetconfigs/{dbId}/{name}")
getDetPreference(value: string): Observable<IDettaglioReg> {
  return this.http.get<IDettaglioReg>(`${ environment.apiEndpoint }datasetconfigs/reg/${ value }`);
  // return this.http.get<any>(environment.apiEndpoint+"preferences/reg");
}

// Salva la configurazione dell'insieme di sensori selezionati col nome dato per
// l'utente corrente
// Attualmente questo tipo di configurazione può essere memorizzato solo nella
// banca dati regionale
// {dbId}: identificatore del data base reg=regionale
// {name}: nome della configurazione da salvare
// La configurazione da salvare va passata nel body in Json, vedere funzione di
// lettura per i dettagli
// https://<server_name>/ariaweb/airvalidsrv/datasetconfigs/reg/prova
// valore restituito:
// numero di oggetti inseriti nella banca dati
//@PUT
//@Produces(MediaType.APPLICATION_JSON)
//@Consumes(MediaType.APPLICATION_JSON)
//@Path("/datasetconfigs/{dbId}/{name}")

setConfigSensorsList(body:any,nameConfig:string): Observable<any> {
  //let body={"prova":"prova","listSensorId":["11.01234.801.21","11.01235.802.05"],"timeUnit":"TIMESTAMP","beginTime":1682892000000,"endTime":1683237600000,"activityType":"validation","activityOptions":""}
  return this.http.put<any>(environment.apiEndpoint+"datasetconfigs/reg/"+nameConfig,body);
}


// Restituisce una preferenza applicativa memorizzata nella banca dati per
// l'utente corrente
// Attualmente le preferenze possono essere memorizzate solo nella banca dati
// regionale
// {dbId}: identificatore del data base reg=regionale
// {group_id}: nome del gruppo a cui appartiene la preferenza
// {id}: identificatore della preferenza
// L'oggetto JSON restituito ha i seguenti campi
// - groupId: nome del gruppo a cui appartiene la preferenza
// - id: identificatore della preferenza
// - type: tipo del valore: 1=integer, 2=double, 3=boolean, 4=string
// - value: valore della preferenza (può essere null)
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/preferences/reg/gruppo_prova/prova01
// valore restituito:
// {"groupId":"gruppo_prova","id":"prova01","type":4,"value":"valore_di_esempio"}
//@GET
//@Produces(MediaType.APPLICATION_JSON)
//@Path("/preferences/{dbId}/{group_id}/{id}")

// Restituisce tutte le preferenze applicative memorizzate nella banca dati per
// l'utente corrente e il gruppo di preferenze specificato
// Attualmente le preferenze possono essere memorizzate solo nella banca dati
// regionale
// {dbId}: identificatore del data base reg=regionale
// {group_id}: nome del gruppo a cui appartiene la preferenza
// L'oggetto JSON restituito ha i seguenti campi
// - groupId: nome del gruppo a cui appartiene la preferenza
// - id: identificatore della preferenza
// - type: tipo del valore: 1=integer, 2=double, 3=boolean, 4=string
// - value: valore della preferenza (può essere null)
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/preferences/reg/gruppo_prova
//@GET
//@Produces(MediaType.APPLICATION_JSON)
//@Path("/preferences/{dbId}/{group_id}")

// Restituisce tutte le preferenze applicative memorizzate nella banca dati per
// l'utente corrente
// Attualmente le preferenze possono essere memorizzate solo nella banca dati
// regionale
// {dbId}: identificatore del data base reg=regionale
// L'oggetto JSON restituito ha i seguenti campi
// - groupId: nome del gruppo a cui appartiene la preferenza
// - id: identificatore della preferenza
// - type: tipo del valore: 1=integer, 2=double, 3=boolean, 4=string
// - value: valore della preferenza (può essere null)
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/preferences/reg
//@GET
//@Produces(MediaType.APPLICATION_JSON)
//@Path("/preferences/{dbId}")

// Inserisce una preferenza applicativa memorizzata nella banca dati per
// l'utente corrente
// Attualmente le preferenze possono essere memorizzate solo nella banca dati
// regionale
// {dbId}: identificatore del data base reg=regionale
// {group_id}: nome del gruppo a cui appartiene la preferenza
// {id}: identificatore della preferenza
// L'oggetto JSON da inviare al server deve avere i seguenti campi
// - type: tipo del valore: 1=integer, 2=double, 3=boolean, 4=string
// - value: (opzionale) valore della preferenza
// Esempio:
// {"type":4,"value":"valore_di_esempio"}
// https://<server_name>/ariaweb/airvalidsrv/preferences/reg/gruppo_prova/prova01
// valore restituito:
// numero di oggetti inseriti in banca dati
//@PUT
//@Produces(MediaType.APPLICATION_JSON)
//@Consumes(MediaType.APPLICATION_JSON)
//@Path("/preferences/{dbId}/{group_id}/{id}")

setConfigList(): Observable<any> {
  let body={groupId: "gruppo_prova", id: "prova06", type: 4, value: ""}
  return this.http.put<any>(environment.apiEndpoint+"preferences/reg/gruppo_prova/test",body);
}

// Cancella una preferenza applicativa memorizzata nella banca dati per
// l'utente corrente
// Attualmente le preferenze possono essere memorizzate solo nella banca dati
// regionale
// {dbId}: identificatore del data base reg=regionale
// {group_id}: nome del gruppo a cui appartiene la preferenza
// {id}: identificatore della preferenza
// https://<server_name>/ariaweb/airvalidsrv/preferences/reg/gruppo_prova/prova01
// valore restituito:
// numero di oggetti cancellati dalla banca dati
//@DELETE
//@Produces(MediaType.APPLICATION_JSON)
//@Path("/preferences/{dbId}/{group_id}/{id}")

// Cancella le preferenze applicative memorizzate nella banca dati per
// l'utente corrente e il gruppo specificato
// Attualmente le preferenze possono essere memorizzate solo nella banca dati
// regionale
// {dbId}: identificatore del data base reg=regionale
// {group_id}: nome del gruppo a cui appartiene la preferenza
// https://<server_name>/ariaweb/airvalidsrv/preferences/reg/gruppo_prova
// valore restituito:
// numero di oggetti cancellati dalla banca dati
//@DELETE
//@Produces(MediaType.APPLICATION_JSON)
//@Path("/preferences/{dbId}/{group_id}")

// Cancella le preferenze applicative memorizzate nella banca dati per
// l'utente corrente
// Attualmente le preferenze possono essere memorizzate solo nella banca dati
// regionale
// {dbId}: identificatore del data base reg=regionale
// https://<server_name>/ariaweb/airvalidsrv/preferences/reg
// valore restituito:
// numero di oggetti cancellati dalla banca dati
//@DELETE
//@Produces(MediaType.APPLICATION_JSON)
//@Path("/preferences/{dbId}")
}
