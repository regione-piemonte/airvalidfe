/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from '@angular/core';
import {UserStateLock} from '@services/core/api';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {environment} from '@environments/environment';
import {catchError, EMPTY, map, mergeMap, Observable, of, retry, tap, throwError} from "rxjs";
import {TypeValueToSpecialistico} from "@state/effects/*";
import IResponseReportistica, {ElaborazioniReportType, IParamsToReport, IPeriodoService, IPropsElaborazioni, test, TypeOfValidataRepost} from "@services/core/api/reportistica/models/getReportistica.model";
import {ResponseToReport} from "@models/response/report.interface";
import {DateSettingService} from "@services/core/utility/date-setting.service";
import {ITabelleParams} from "@components/shared/dialogs/reportistica-standard/model/standard.model";
import {IResponseAnagragh} from "@services/core/api/reportistica/models/getResponseAnagrafh.model";
import {IResponseItems, IResponseReportElaborazione} from "@services/core/api/reportistica/models/getResponseItem.model";
import {Store} from "@ngrx/store";
import {AppState} from "../../../../state";
import {addProgressReportisticaAction} from "@actions/*";
import { NgxSpinnerService } from 'ngx-spinner'
import { MatDialog } from '@angular/material/dialog'


export type LanguageType = 'IT' | 'EN';

export type DbIdType = 'reg' | 'cop';

export type ItemSearchType = 'NETWORK' | 'STATION' | 'PARAMETER' | 'SENSOR';

interface IPropsAnagraph {
  dbId?: DbIdType;
  beginTime: string;
  endTime: string;
  language?: LanguageType;
  itemType?: ItemSearchType;
  itemIds?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportisticaService {

  headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'UseInterceptors': 'true',
  });

  constructor(
    private http: HttpClient,
    private dateSetting: DateSettingService,
    private store: Store<AppState>,
    private spinner: NgxSpinnerService,
    private dialog: MatDialog
  ) {
  }


  private createObservable<T>(method: Function, db: UserStateLock, periodo: IPeriodoService, name: string): Observable<{ data: test<T>; parametro: string }> {
    return method(db, {...periodo}).pipe(
      map(data => ({data, parametro: name}))
    );
  }

  getService<T>(value: TypeValueToSpecialistico, db: UserStateLock = 'cop', periodo: IPeriodoService, name: string): Observable<{ data: Array<TypeOfValidataRepost>, parametro: string }> {
    const methods: Record<TypeValueToSpecialistico, Function> = {
      validato: this.getDatiNonCertificati.bind(this),
      noncertificato: this.getTimestampNonCertificati.bind(this),
      validatonullo: this.getTimestampValidatiNoValue.bind(this),
      certificato: this.getDatiNonCertificati.bind(this, db, {...periodo, verificationLevel: '1'}),
      nonvalidato: this.getTimestampNonValidati.bind(this),
      assenti: this.getTimestampMancanti.bind(this),
      ipametalli: this.getTimestampIpaMetalli.bind(this),
      darivedere: this.getTimestampDaRivedere.bind(this)
    };

    const method = methods[value];
    if (!method) throw new Error(`value not found ${value} non ancora implementato`);
    if (value !== 'validato' && value !== 'certificato') {
      return this.createObservable<Array<number>>(method, db, periodo, name).pipe(
        map(({data, parametro}) => {
          return {
            data: data.map(number => ({timestamp: number, valore_validato: undefined})),
            parametro
          }
        })
      );
    }

    return this.createObservable<Array<TypeOfValidataRepost>>(method, db, periodo, name).pipe(
      map(({data, parametro}) => {
        return {
          data,
          parametro
        }
      })
    );
  }

  /**
   * @description Restituisce le misure presenti nel database per il sensore e il periodo specificati,
   * utilizzando un oggetto con numero minimo di campi (timestamp e valore_validato).
   * @param {UserStateLock} dbId
   * @param {string} sensorId
   * @param {string} startDate
   * @param {string} endDate
   * @param {string} period_m
   * @param {string} verificationLevel optional 1-2-3 di default 1 di certificazione
   * @example
   * getDatiNonCertificati('cop', '13.001272.803.21', '2020-01-01', '2020-01-31', '60')
   * getDatiNonCertificati('cop', '13.001272.803.21', '2020-01-01', '2020-01-31', '2400')
   */
  getDatiNonCertificati(dbId: UserStateLock = 'cop', {endDate, startDate, period_m, sensorId, verificationLevel = '2'}: IPeriodoService): Observable<Array<TypeOfValidataRepost>> {
    return this.http.get<Array<TypeOfValidataRepost>>(`${environment.apiEndpoint}validdata/${dbId}/${sensorId}/${startDate}?endDate=${endDate}&period_m=${period_m}&verificationLevel=${verificationLevel}`, {headers: this.headers}).pipe(
      // takeToResult(lista => lista)
    );
  }

  /**
   * @description Restituisce l'elenco dei timestamp delle misure presenti nella banca dati che non hanno il flag di certificazione impostato.
   * @param {UserStateLock} dbId
   * @param {string} sensorId
   * @param {string} beginDate
   * @param {string} endDate
   * @example
   * getTimestampNonCertificati('cop', '13.001272.803.21', '2020-01-01', '2020-01-31')
   */
  getTimestampNonCertificati(dbId: UserStateLock = 'cop', {sensorId, startDate: beginDate, endDate}: IPeriodoService): Observable<Array<number>> {
    return this.http.get<Array<number>>(`${environment.apiEndpoint}datatimestamps/notcertified//${dbId}/${sensorId}/${beginDate}/${endDate}`, {headers: this.headers}).pipe(
      // takeToResult(lista => lista)
    )
  }

  /**
   * @description Restituisce l'elenco dei timestamp delle misure presenti nella banca dati che hanno
   * il flag 'da rivedere' impostato a 'true' per il sensore e periodo specificati
   * @param {UserStateLock} dbId
   * @param {string} sensorId
   * @param {string} beginDate
   * @param {string} endDate
   * @example
   * getTimestampDaRivedere('cop', '13.001272.803.21', '2020-01-01', '2020-01-31')
   */
  getTimestampDaRivedere(dbId: UserStateLock = 'cop', {sensorId, startDate: beginDate, endDate}: IPeriodoService): Observable<Array<number>> {
    return this.http.get<Array<number>>(`${environment.apiEndpoint}datatimestamps/toreview/${dbId}/${sensorId}/${beginDate}/${endDate}`, {headers: this.headers}).pipe();
  }

  /**
   * @description Restituisce l'elenco dei timestamp delle misure presenti nella banca dati che non sono ancora state validate per il sensore e periodo specificati
   * @param {UserStateLock} dbId
   * @param {string} sensorId
   * @param {string} beginDate
   * @param {string} endDate
   * @example
   * getTimestampNonValidati('cop', '13.001272.803.21', '2020-01-01', '2020-01-31')
   */
  getTimestampNonValidati(dbId: UserStateLock = 'cop', {endDate, startDate: beginDate, sensorId}: IPeriodoService): Observable<Array<number>> {
    return this.http.get<Array<number>>(`${environment.apiEndpoint}datatimestamps/notvalidated/${dbId}/${sensorId}/${beginDate}/${endDate}`, {headers: this.headers}).pipe();
  }

  /**
   * @description Restituisce l'elenco dei timestamp delle misure presenti nella banca dati che sono state validate come valide pur avendo
   * il valore_validato impostato a null, per il sensore e periodo specificati
   * @param {UserStateLock} dbId
   * @param {string} sensorId
   * @param {string} beginDate
   * @param {string} endDate
   * @example
   * getTimestampValidatiNoValue('cop', '13.001272.803.21', '2020-01-01', '2020-01-31')
   */
  getTimestampValidatiNoValue(dbId: UserStateLock = 'cop', {sensorId, startDate: beginDate, endDate}: IPeriodoService): Observable<Array<number>> {
    return this.http.get<Array<number>>(`${environment.apiEndpoint}datatimestamps/validnovalue/${dbId}/${sensorId}/${beginDate}/${endDate}`, {headers: this.headers}).pipe();
  }

  /**
   * @description Restituisce l'elenco dei timestamp delle misure che non sono presenti nella banca dati
   * (nemmeno come dato di tipo mancante) per il sensore e periodo specificati
   * @param {UserStateLock} dbId
   * @param {string} sensorId
   * @param {string} beginDate
   * @param {string} endDate
   * @param {string} period_m
   * @example
   * getTimestampMancanti('cop', '13.001272.803.21', '2020-01-01', '2020-01-31', '60')
   */
  getTimestampMancanti(dbId: UserStateLock = 'cop', {sensorId, startDate: beginDate, endDate, period_m}: IPeriodoService): Observable<Array<number>> {
    return this.http.get<Array<number>>(`${environment.apiEndpoint}datatimestamps/notcompleted/${dbId}/${sensorId}/${beginDate}/${endDate}/${period_m}`, {headers: this.headers}).pipe();
  }

   /**
   * @description Restituisce l'elenco dei timestamp delle misure con valore di IPA non coerente con le polveri
   * (nemmeno come dato di tipo mancante) per il sensore e periodo specificati
   * @param {UserStateLock} dbId
   * @param {string} sensorId
   * @param {string} beginDate
   * @param {string} endDate
   * @param {string} period_m
   * @example
   * getTimestampIpaMetalli('cop', '13.001272.803.21', '2020-01-01', '2020-01-31', '60')
   */
   getTimestampIpaMetalli(dbId: UserStateLock = 'cop', {sensorId, startDate: beginDate, endDate, period_m}: IPeriodoService): Observable<Array<number>> {
    return this.http.get<Array<number>>(`${environment.apiEndpoint}datatimestamps/ipacheck/${dbId}/${sensorId}/${beginDate}/${endDate}`, {headers: this.headers}).pipe();
  }

  /**
   * @description Effettua l'elaborazione specificata utilizzando le misure presenti nel database per il sensore e il periodo specificati
   * @param {string} type di elaborazione da effettuare
   * @param {UserStateLock} dbId
   * @param {string} sensorId
   * @param {string} beginDate
   * @param {string} endDate
   * @param {string} period_m
   * @param {string} verificationLevel optional
   * @param {string} decimalDigits optional
   *
   * Parametri:
   * "period_m": periodo di aggregazione delle misure (es. 60 minuti); serve per non leggere eventuali misure con il timestamp incoerente con il periodo di aggregazione e per creare misure  fittizie senza valore e con codice dato mancante, qualora non fossero presenti una o più misure nel periodo richiesto (questo garantisce che il numero di misure ottenuto sia coerente con l'ampiezza del periodo richiesto)
   * "verificationLevel": livello minimo di verifica richiesto per le misure da utilizzare (opzionale, il livello di default è quello massimo)
   * "decimalDigits": numero di cifre decimali da usare per l'arrotondamento finale dei risultati (opzionale)
   *
   * @example
   * elabora('media', 'cop', '13.001272.803.21', '2020-01-01', '2020-01-31', '60')
   * elaboration/datasplitbyday/cop/13.001272.803.04/1672527600000/1680303600000?period_m=60&verificationLevel=3&decimalDigits=1
   */
  getElaborazioni({type, dbId = 'cop', sensorId, beginDate, endDate, period_m, verificationLevel, decimalDigits}: IPropsElaborazioni): Observable<IResponseReportistica> {

    return this.http.get<IResponseReportistica>(`${environment.apiEndpoint}elaboration/${type}/${dbId}/${sensorId}/${beginDate}/${endDate}?period_m=${period_m}&verificationLevel=${verificationLevel}&decimalDigits=${decimalDigits}`).pipe(
      catchError(error => of({
        id: 'elaborazioni',
        description: 'Elaborazioni',
        listResult: []
      }))
    );
  }

  /**
   * Retrieves elaboration reports.
   *
   * @param {ElaborazioniReportType} type - The type of the report.
   * @param {UserStateLock} [db='cop'] - The user state lock.
   * @param {IParamsToReport} props - Additional parameters for the report.
   * @returns {Observable<any>} - Observable containing the response from the server.
   * @throws {Error} - Throws an error if no sensor id is provided.
   */
  getElaborazioniReport(type: ElaborazioniReportType, db: UserStateLock = 'cop', props: IParamsToReport): Observable<ResponseToReport> {
    this._handleErrorToProps(type, props);
    return this.http.post<ResponseToReport>(`${environment.apiEndpoint}report/${type}/${db}`, [...props.sensorIds], {params: this._createParams(type, props)})
  }

  /**
   * @description Questo metodo privato può essere utilizzato per gestire eventuali errori legati ai parametri forniti alla metodologia di reportistica.
   * Nel caso non siano stati forniti degli id sensori, viene lanciata un'eccezione.
   * Inoltre, a seconda del tipo di report richiesto ("daily", "variable" o "yearly"),
   * verifica la presenza di una data specifica o un intervallo di date e lancia un'eccezione se mancano.
   * @param {ElaborazioniReportType} type Tipo di report da creare. Può essere "daily", "variable" o "yearly".
   * @param {IParamsToReport} props Oggetto che contiene i parametri per il report, inclusi gli id dei sensori e le date.
   * @example
   * _handleErrorToProps('daily', {sensorIds: ['1', '2'], date: '2022-09-01'}) Nessun errore scatenato
   * _handleErrorToProps('daily', {sensorIds: ['1', '2']}) Lancia un errore perché non è stata fornita nessuna data
   * @throws {Error} Se manca l'elenco degli id dei sensori, se manca una data nel caso di report giornaliero,
   * se manca la data di inizio o di fine nel caso di report variabile, o se manca l'anno nel caso di report annuale.
   */
  private _handleErrorToProps(type: ElaborazioniReportType, props: IParamsToReport) {
    if (!props.sensorIds || !props.sensorIds.length) {
      throw new Error('No sensor id provided');
    }
    switch (type) {
      case "daily":
        if (!props.date) {
          throw new Error('No date provided');
        }
        break;
      case "variable":
        if (!props.beginDate) {
          throw new Error('No begin date provided');
        }
        if (!props.endDate) {
          throw new Error('No end date provided');
        }
        break;
      case "yearly":
        if (!props.anno) {
          throw new Error('No anno has been provided');
        }
        break;
    }
  }

  /**
   * Creates and returns HttpParams based on the given type and parameters.
   *
   * @param type - The type of the ElaborazioniReport. Possible values are "daily", "variable", or "yearly".
   * @param paramsToReport - The parameters required to create the HttpParams object.
   *                        It should have the properties: date, beginDate, endDate, anno, verificationLevel, and sensorIds.
   *
   * @returns An HttpParams object with the specified parameters added.
   */
  private _createParams(type: ElaborazioniReportType, {
    date,
    beginDate,
    endDate,
    anno,
    validatedDataOnly,
    sensorIds,
    anagraphInfoByRows,
    displayNetNames,
    displayColors,
    tableIds
  }: IParamsToReport): HttpParams {

    let params = new HttpParams();
    // sensorIds!.forEach((id: string) => {
    //   params = params.append('sensorIds', id);
    // })
    params = params.append('validatedDataOnly', validatedDataOnly!);
    params = params.append('anagraphInfoByRows', anagraphInfoByRows);
    params = params.append('displayNetNames', displayNetNames);
    params = params.append('displayColors', displayColors);
    switch (type) {
      case "daily":
        let initialDate = this.dateSetting.createInitDay(new Date(+date!).toString(), undefined, {hours: 1, minutes: 0, seconds: 0}).getTime();
        params = params.append('date', initialDate)
        break;
      case "variable":
        let initialDateVariabile = this.dateSetting.createInitDay(new Date(+beginDate!).toString(), undefined, {hours: 1, minutes: 0, seconds: 0}).getTime();

        params = params.appendAll({beginDate: initialDateVariabile, endDate: endDate!})
        break;
      case "yearly":
        params = params.append('year', anno!)
        break;
    }

    if (tableIds) {
      params = this._createTableIds(params, tableIds)
    }


    return params
  }

  private _createTableIds(params: HttpParams, tabelle: ITabelleParams): HttpParams {
    for (let tabelleKey in tabelle) {
      let id = undefined;
      if (tabelle[tabelleKey as keyof ITabelleParams]) {
        switch (tabelleKey as keyof ITabelleParams) {
          case "sintesi":
            id = 0;
            break;
          case "giorno_medio":
            id = 1;
            break;
          case "statistiche_giornaliere":
            id = 2;
            break;
          case "statistiche_mensili":
            id = 4;
            break;
          case "matrice_oraria":
            id = 3;
            break;
          case "stat_giorni_settimana":
            id = 5;
            break;
          case "percentili":
            id = 6;
            break;
        }
        params = params.append('tableIds', id!)
      }
    }
    return params;
  }

  /**
   * @description Creo un servizio nuovo per ricevere le elaborazioni specialistiche
   * @param {'IT'|'EN'} language - Il linguaggio con qui ricevere la descrizione dei servizi
   */
  getListOfElaborazioneSpecialistica(language: 'IT' | 'EN' = 'IT') {
    return this.http.get<{ id: string, name: string, description: string }[]>(`${environment.apiEndpoint}specreports`, {
      params: {language},
    })
  }

  /**
   * @description Creo un servizio che mi restituisca i report specificato
   * @param {string} specificaID - id specifica richiesta
   * @param {LanguageType} language - Il linguaggio con qui ricevere la descrizione dei servizi
   */
  getSpecificaSelected(specificaID: string, language: LanguageType = 'IT'): Observable<IResponseAnagragh> {
    return this.http.get<IResponseAnagragh>(`${environment.apiEndpoint}specreports/${specificaID}`, {
      params: {language},
    })
  }


  getAnagraphData(reportId: string, {language = 'IT', itemType, itemIds, dbId = 'cop', beginTime, endTime}: IPropsAnagraph) {

    let params = new HttpParams().set('language', language);

    if (itemType) {
      params = params.set('itemType', itemType);
    }

    if (itemIds && itemIds.length > 0) {
      itemIds.forEach(itemId => {
        params = params.append('itemIds', itemId);
      });
    }

    const url = `${environment.apiEndpoint}/specreports/${reportId}/${itemType === 'SENSOR' ? 'execute' : 'anagraph'}/${dbId}/${beginTime}/${endTime}`;

    return this.http.get<IResponseItems>(url, {params});
  }

  getReport(reportId: string, {language = 'IT', itemType, itemIds, dbId = 'cop', beginTime, endTime}: IPropsAnagraph) {

    let params = new HttpParams().set('language', language);

    if (itemType) {
      params = params.set('itemType', itemType);
    }

    if (itemIds && itemIds.length > 0) {
      // params = params.append('itemIds', itemIds.join())
      // itemIds.forEach(itemId => {
      //   params = params.append('itemIds', itemId);
      // });
    }

    const url = `${environment.apiEndpoint}specreports/${reportId}/execute/${dbId}/${beginTime}/${endTime}`;

    return this.http.post<{ id: string }>(url, [...itemIds!], {params});
  }

  getStatusReport(uuid: string) {
    return this.http.get<{ status: string; uuid: string; progress: number } | IResponseReportElaborazione>(`${environment.apiEndpoint}deferredtask/result/${uuid}`).pipe(
      mergeMap(response => {
        // Controllo che ci sia status nella response
        if ('status' in response) {
          console.info('Report in progress', response.progress);
          document.body.classList.add('hide-spinner');
          this.spinner.hide('global');
          this.store.dispatch(addProgressReportisticaAction(response.progress));
          return throwError(() => new Error(`Report in progress ${response.progress}`));
        }

        return of({...response, uuid})
      }),
      retry(10),
      catchError(e => {
        console.info('Errore', e)
        this.dialog.closeAll();
        return EMPTY;
      }),
      tap((response) => {
        console.info('Report risolto completamente', response);
        document.body.classList.remove('hide-spinner');
      } ),
    )
  }
}
