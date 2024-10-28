/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import moment from 'moment';
import {catchError, EMPTY, forkJoin, iif, map, mergeMap, Observable, of, switchMap, throwError, toArray} from 'rxjs';
import {IRequestDataSet, ITimeSelected} from '@components/shared/validazione-dettaglio/models/time-selected.model';
import {IGrafico, ITaratura} from '@models/grafico';
import {IParameter} from '@models/dataService';
import {addHours, format, isFuture, setHours, setMinutes} from 'date-fns';
import {LocalService} from '../../locale/local.service';
import {environment} from '@environments/environment';
import {UserStateLock} from "@services/core/api";
import {TipoTarature} from "../../../../state";

export interface IValoreModificatoResponse {
  timestamp: number;
  valore_validato: number;
}

@Injectable({
  providedIn: 'root'
})
export class DatasService {
  listaParameters: IParameter[] = [];

  constructor(private readonly http: HttpClient, private readonly localService: LocalService) {
  }


  /**
   * Restituisce le misurazioni disponibili nel database per il sensore specificato e il periodo.
   *
   * @param key Una chiave di tipo stringa che rappresenta l'identificatore combinato.
   * @param period Il periodo di aggregazione delle misurazioni (ad esempio, 60 minuti).
   * @param date Opzionale. Un oggetto che contiene le date di inizio e fine per il periodo di misurazione.
   *
   * I parametri sono:
   * @param {dbId} L'identificatore del database. 'reg' per regionale o 'cop' per Arpa per la validazione.
   * @param {sensorId} L'identificatore dell'oggetto sensore.
   * @param {beginDate} La data di inizio del periodo di misurazione.
   * @param {endDate} Opzionale. La data di fine del periodo di misurazione.
   * @param {period_m} Il periodo di aggregazione delle misurazioni. Utilizzato per evitare di leggere misurazioni con timestamp incoerenti
   * con il periodo di aggregazione e per creare misurazioni fittizie senza valore e con codice di dati mancanti se una o
   * più misurazioni non sono presenti nel periodo richiesto. Questo garantisce che il numero di misurazioni ottenute sia
   * coerente con la lunghezza del periodo richiesto.
   *
   * Esempio:
   * @example
   * https://<nome_server>/ariaweb/airvalidsrv/data/cop/13.001272.803.21/1669762800000?endDate=1669849200000&period_m=60
   *
   * @returns Un array Observable di oggetti ITimeSelected.
   */
  getSensorData(key: string, period: number, date?: { start: number | string, end: number | string }): Observable<ITimeSelected[]> {

    return this.localService.getTimeStore()
      .pipe(
        switchMap(data => {
          let {periodo, tipo_periodo} = data!;
          let {dataInizioTime: start, dataFineTime: end} = periodo!;
          let {date: asDateEnd, utc: utcEnd} = this._getData(+end!);
          // Setto la data di fine al minuto in cui finisce l'ora
          start = setMinutes(setHours(new Date(+start!), +this._getData(+start!).utc), 1).getTime().toString();
          // setto la data inizio nel local storage
          this.localService.setDateStore('dataInizioTime', start);

          end = setMinutes(setHours(new Date(+end!), +utcEnd), 0).getTime().toString();

          // Se il tipo_periodo è annuale verifico che la data finale non sia mai superiore alla data odierna
          if (tipo_periodo === 'annuale' && isFuture(+end!)) {

            end = addHours(setMinutes(setHours(new Date(), +utcEnd), 0), 2).getTime().toString();
            this.localService.setDateStore('dataFineTime', end);
          }

          if (date) {
            let {date: asDateStart, utc: utcStart} = this._getData(+date.start);
            let {date: asDateEnd, utc: utcEnd} = this._getData(+date.end);
            start = addHours(asDateStart, +utcStart).getTime().toString();
            end = addHours(asDateEnd, +utcEnd).getTime().toString();
          }

          // Significa che sono nel confronta nel tempo
          if (key.includes("|")) {
            // Devo prima verificare che gli anni delle date sia uguali
            let annoStart = new Date(+start).getFullYear();
            let annoEnd = new Date(+end).getFullYear();
            let difAnno = annoStart < annoEnd;
            const anno = +key.substring(key.indexOf("|") + 1, key.length);
            start = (moment(+start!).year(anno).valueOf()).toString();
            end = (moment(+end!).year(difAnno ? anno + 1 : anno).valueOf()).toString();
            key = key.substring(0, key.indexOf("|"))
            // console.info("Anno", anno)
            // console.info("chiave", key)
          }
          return this.http.get<ITimeSelected[]>(environment.apiEndpoint + "data/cop/" + key + "/" + start + "?endDate=" + end + '&period_m=' + period)
            .pipe(
              map(lista => lista.map(item => ({...item, timeFormat: format(item.timestamp, 'dd/MM/yyyy HH:mm'), timeFormatUTC: new Date(item.timestamp).toUTCString()}))),
              catchError(err => {
                console.error(err);
                let endDate = new Date(+end!).toUTCString();
                if (isFuture(+end!)) {
                  end = new Date().toUTCString();
                  return this.http.get<ITimeSelected[]>(environment.apiEndpoint + "data/cop/" + key + "/" + start + "?endDate=" + end + '&period_m=' + period).pipe(
                    map(lista => lista.map(item => ({...item, timeFormat: format(item.timestamp, 'dd/MM/yyyy HH:mm'), timeFormatUTC: new Date(item.timestamp).toUTCString()}))),
                  )
                }
                return EMPTY;
              })
            )
        })
      )

  }

  /**
   * Retrieves sensor data using forkJoin mechanism.
   *
   * @param parametri - An array of parameters.
   * @param lista - A readonly array of observable time selected data.
   * @returns An observable array of graphs.
   */
  getForkJoinSensorData(parametri: IParameter[], lista: Array<Observable<ITimeSelected[]>>): Observable<IGrafico[]> {
    this.listaParameters = parametri;
    return forkJoin(lista)
      .pipe(
        switchMap((lista) => lista),
        map((time, index) => {
          let data = this._transformTimestamps(time)

          return this._processData(parametri[index], time);
        }),
        toArray(),
      );
  }

  /**
   * Processes the given data.
   * Riceve un parametro e un array di misure e restituisce un oggetto di tipo IGrafico
   *
   * @param {IParameter} Parametro ricevuto.
   * @param {Array<ITimeSelected>} data - The data to be processed.
   *
   * @return {object} - The processed data object.
   */
  private _processData({area, parametro, stazione, visible, visibleOrigin, visibleNotValid, locked, userLock, color}: IParameter, data: Array<ITimeSelected>): IGrafico {
    let {name, key} = parametro;
    let {name: nameStazione} = stazione;
    return {
      area,
      parametro,
      stazione,
      visible,
      visibleOrigin,
      visibleNotValid,
      locked,
      userLock,
      color,
      name: name + ' - ' + nameStazione,
      dataset: data,
      taratura: [],
      key
    };
  }

  /**
   * Transforms the timestamps in the given array of objects.
   *
   * @param {Array<A extends {timestamp: number}>} time - The array of objects with timestamps to be transformed.
   * @return {Array<A>} - The transformed array of objects with updated timestamps.
   */
  private _transformTimestamps<A extends { timestamp: number }>(time: Array<A>): Array<A> {
    return time.map(value => {
      let {date, utc} = this._getData(value.timestamp);
      return {
        ...value,
        timestamp: addHours(date, -utc).valueOf()
      }
    });
  }

  /**
   * @description Generates an object containing date and utc information based on the given value.
   *
   * @param {number} value - The value used to create the date and utc information.
   * @return {object} - An object with date and utc properties.
   */
  private _getData(value: number): { date: Date, utc: number } {
    return {
      date: new Date(value),
      utc: new Date(value).getTimezoneOffset() / -60 === 1 ? 0 : 1,
    }
  }


  /**
   * @description Scrive nella banca dati l'elenco delle misure passato come parametro
   *
   * @param {string} key - The identifier of the sensor object.
   * @param {Array<ITimeSelected>} items - The list of measurements to write.
   * @param {UserStateLock} dbId - The identifier of the database. Default value is 'cop'.
   *
   * @returns {Observable<number>} - The Observable that emits the number of successful write operations.
   *
   * Example usage:
   * const key = '13.001272.803.21';
   * const item = [{timestamp: 1627591200, value: 25}, {timestamp: 1627591800, value: 28}];
   * const dbId = 'cop';
   * setSensorData(key, item, dbId).subscribe(result => console.info('Success!', result ));
   */
  setSensorData(key: string, items: Array<ITimeSelected>, dbId: UserStateLock = 'cop'): Observable<number> {
    // item = item.map( value => ( { ...value , timestamp: addHours( new Date( value.timestamp ) , 1 ).valueOf() } ) );
    let data: Array<ITimeSelected> = items.map(({timeFormatUTC, ...value}) => {
      let {date, utc} = this._getData(value.timestamp);

      return {
        ...value,
        // timestamp: addHours(date, utc).valueOf()
      }
    })
    let body = data.map<IRequestDataSet>(({changed, index, timeFormat, ...value}) => ({...value}));

    return this.http.put<number>(`${environment.apiEndpoint}data/${dbId}/${key}`, body);
  }


// Imposta il flag di certificazione per il sensore e il periodo specificati.
// Una volta che il flag di certificazione è impostato, non può essere più
// cancellato usando le API di questo webservice.
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// {beginDate}: data di inizio del periodo di ricerca delle misure
// {endDate}: data di fine del periodo di ricerca delle misure (opzionale)
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/data/certification/cop/13.001272.803.21/1669762800000/1669849200000
  setSensorValidFlag(item: any): Observable<any> {
    return this.http.put(environment.apiEndpoint + "data/certification/cop/13.001272.803.21/1669762800000/1669849200000", item);
  }


// Imposta il flag di dato da rivedere per il sensore e il periodo specificati
// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
// {sensorId}: identificatore dell'oggetto sensore
// {beginDate}: data di inizio del periodo di ricerca delle misure
// {endDate}: data di fine del periodo di ricerca delle misure
// Esempio:
// https://<server_name>/ariaweb/airvalidsrv/data/toreviewflag/cop/13.001272.803.21/1669762800000/1669849200000
  setSensorDataReviewFlag(item: any): Observable<any> {
    return this.http.put(environment.apiEndpoint + "data/toreviewflag/cop/13.001272.803.21/1669762800000/1669849200000", item);
  }

  /**
   * @description Restituisce l'elenco delle calibrazioni effettuate sullo strumento che misura
   * il parametro specificato, nel periodo specificato
   * @param {string} key
   * @param {number} start
   * @param {number} end
   * @param {string} type
   * @example
   * https://<server_name>/ariaweb/airvalidsrv/calibrations/${type}/${key}?beginDate=${start}&endDate=${end}
   * @returns {Observable<any>}
   */
  getCalibrations(key: string, start?: number, end?: number, type: string = 'cop'): Observable<Array<ITaratura>> {
    return iif(() => !start || !end,
      this.localService.getDataWithDataStore((startStore, endStore) => this.http.get<Array<ITaratura>>(environment.apiEndpoint + `calibrations/${type}/${key}?beginDate=${startStore}&endDate=${endStore}`)),
      this.http.get<Array<ITaratura>>(environment.apiEndpoint + `calibrations/${type}/${key}?beginDate=${start}&endDate=${end}`)
    ).pipe(
      mergeMap((calibrations) => {
        if (!calibrations.length) {
          return throwError(() => ({message: 'Nessuna taratura disponibile'}));
        }
        if (calibrations.length === 1) {
          return throwError(() => ({message: 'Una sola taratura disponibile, allungare periodo'}));
        }
        return of(calibrations);
      }),
    );
  }


  /**
   *  Effettua la correzione delle misure sul periodo specificato, usando le informazioni delle calibrazioni
   *  @param dbId identificatore del data base reg=regionale cop=Arpa per validazione
   *  NOTA: le informazioni relative alle misure vengono lette dal data base specificato, quelle relative alle calibrazioni vengono lette sempre dal data base regionale
   *  @param sensorId identificatore dell'oggetto sensore
   *  @param beginDate data di inizio del periodo di correzione
   *  @param endDate data di fine del periodo di correzione
   *  @param mode Tipo taratura da eseguire
   *  NOTA: le date di inizio e fine devono essere nello stesso giorno di due calibrazioni distinte e non vi devono essere altre calibrazioni all'interno del periodo specificato
   *  @example
   *  https://<server_name>/ariaweb/airvalidsrv/calibrations/measurecorrection/cop/13.001272.803.21/1669762800000/1669849200000
   */
  setMeasureCorrection(sensorId: string, beginDate: number, endDate: number, dbId: 'reg' | 'cop' = 'reg', mode: TipoTarature = 'constant'): Observable<Array<IValoreModificatoResponse>> {
    let params = new HttpParams();
    params = params.append('mode', mode);
    return this.http.get<Array<IValoreModificatoResponse>>(environment.apiEndpoint + `calibrations/measurecorrection/${dbId}/${sensorId}/${beginDate}/${endDate}`, {params})
      .pipe(
        switchMap(lista => lista),
        map(item => ({...item, timestamp: addHours(new Date(item.timestamp), -1).valueOf()})),
        toArray(),
      );
  }


}
