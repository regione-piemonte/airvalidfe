/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {AppState} from '../../index';
import {
  callReport,
  callReportAssenti,
  callReportCertified,
  callReportNotCertified,
  callReportNotManaged,
  callReportNotValid,
  callReportIpaMetalli,
  callReportToReview,
  callReportValidationNull,
  IPropsChangeLavoro,
  callReportToDialogAction, callReportStandardAction, reportStandardAction
} from "@actions/*";
import { forkJoin, map, switchMap, toArray, withLatestFrom} from "rxjs";
import {dbAndAllReportisticaSelector} from "@selectors/*";
import{ ReportisticaService, UserStateLock} from "@services/core/api";
import {format} from "date-fns";
import {Stazioni} from "@models/validazione";
import {IParameter} from "@models/dataService";
import {DateSettingService} from "@services/core/utility/date-setting.service";
import {ElaborazioniReportType, IParamsToReport, TypeOfValidataRepost} from "@services/core/api/reportistica/models/getReportistica.model";

export interface IResponseAllValidata {
  data: Array<TypeOfValidataRepost>;
  parametro: string;
  totData: number;
}

export type TypeValueToSpecialistico = "validato" |"nonvalidato" |"validatonullo" |"certificato" |"noncertificato" |"assenti"|"ipametalli" |"darivedere";

interface IValue {
  key: string;
  periodo: IPropsChangeLavoro;
  measurementPeriod: number;
  name: string;
}

interface IParametriGetListObservable {
  value: TypeValueToSpecialistico;
  db?: UserStateLock;
  periodo?: IPropsChangeLavoro;
  parametri?: IParameter[];
}

@Injectable()
export class DialogTabelleEffects {

  constructor(
    private readonly actions$: Actions ,
    private readonly storeService: Store<AppState> ,
    private readonly reportService: ReportisticaService,
    private readonly dateService: DateSettingService
  ) { }

  /**
  * @description Metodo che ritorna true se la lista ha un solo elemento
   * @param list  lista di parametri
   * @private
   * @returns boolean
   * @example
   * let list = [{name: 'parametro1', key: 'key1'}, {name: 'parametro2', key: 'key2'}]
   * this._getForkJonOrNot(list) // false
  */
  private _getForkJonOrNot<T>(list:T[]): boolean {
    return list?.length === 1;
  }

  private _getAction(value: TypeValueToSpecialistico) {
    switch (value) {
      case 'validato':
        return callReport;
      case 'nonvalidato':
        return callReportNotValid;
      case "noncertificato":
        return callReportNotCertified;
      case "assenti":
        return callReportAssenti;
      case "validatonullo":
        return callReportValidationNull;
      case "certificato":
        return callReportCertified;
      case "ipametalli":
        return callReportIpaMetalli;
      case "darivedere":
        return callReportToReview;
      default:
        return callReportNotManaged;
    }
  }

  /**
  * @description Metodo che rimane in ascolto per l'evento della selezione del report
  */
  callReportEffects$ = createEffect( () => this.actions$.pipe(
    ofType(callReportToDialogAction),
    withLatestFrom(this.storeService.select(dbAndAllReportisticaSelector)),
    switchMap( ([{data}, { db, periodo, parametri}]) => {
      let {value} = data;
      if (this._getForkJonOrNot(parametri!)) {
        let [primoParametro] = parametri!;
        let {key, name, measurementPeriod} = primoParametro.parametro;
        return this.getObservable(value, db,{
          key, periodo, name: this._createNameWithStationOld(name, primoParametro.stazione), measurementPeriod
        })?.pipe(
          toArray(),
          map(data => ({data, type: value, periodo}))
        )
      } else {
        return this._getListObservable({value, db, periodo,parametri: parametri}).pipe(
          map(data => ({data, type: value, periodo}))
        );
      }
    }),
    map( ({data, type, periodo}) => {
      // Devo prendere solo i primi 100 elementi della lista
      let list = data.map(item => {
        if (item.data.length > 100){
          return {...item, data: item.data.slice(0,100),totData: item.data.length};
        }
        return {
          ...item,
          totData: item.data.length
        };
      });
      return this._getAction(type)({report:list, time: Date.now(), formato: format(Date.now(), 'dd/MM/yyyy HH:mm:ss'),periodo});
    })
  ));

  callReportStandard$ = createEffect(() => this.actions$.pipe(
    ofType(callReportStandardAction),
    withLatestFrom(this.storeService.select(dbAndAllReportisticaSelector)),
    switchMap(([{data},{db, periodo,parametri}]) => {
      const {value} = data;
      const {dataInizio, dataFine, standard, dataFineTime, dataInizioTime, lavoro, tipoElaborazione} = periodo;
      let isYearlyControlTime = !!standard && standard?.controlTime === 'yearly';
      let isVariableControlTime = !!standard && standard.controlTime === 'variable';
      let isDailyControlTime = !!standard ?? standard?.controlTime === 'daily';

      const props: IParamsToReport = {
        anno: isYearlyControlTime ? this.dateService.createYear(+dataInizioTime!).toString() : undefined,
        beginDate: isVariableControlTime ? dataInizioTime : undefined,
        endDate: isVariableControlTime ? this.dateService.setTimeToUtc(+dataFineTime!, 6).toString() : undefined,
        sensorIds: parametri?.map(item => item.parametro.key) ?? [],
        date: isDailyControlTime ? dataInizioTime : undefined,
        validatedDataOnly: standard ? standard.flag : undefined,
        displayColors: standard ? standard?.colori_evidenziazione : false,
        displayNetNames: standard ? standard?.nomi_reti : true,
        anagraphInfoByRows: standard ? standard.anagrafiche_righe : false,
        tableIds: standard?.tabelle
      }
      return this.reportService.getElaborazioniReport(value as ElaborazioniReportType, db, props).pipe(
        map(response => ({response, periodo, data}))
      )
    }),
    map(({response, periodo, data}) => {
      return reportStandardAction({
        report: response,
        periodo,
        formato: format(Date.now(), 'dd/MM/yyyy HH:mm:ss'),
        time: Date.now(),
        type: data
      });
    })
  ));

  private _createNameWithStation(stazioni: Array<Stazioni> = [], key: string, name: string) {
    let stazione = stazioni?.find(({key: keyStazione}) => keyStazione.includes(key.split('.').slice(0, 3).join('.')));
    if (stazione) {
      name = `${name} - ${stazione.name}`
    }
    return name;
  }

  /**
  * @description Metodo che scrive il nome del parametro con la stazione
   * @param {string} name nome del parametro
   * @param {Stazioni} stazione stazione
   * @return {string} nome del parametro con la stazione
   * @example
   * this._createNameWithStation(parametro) // 'parametro - stazione'
   * @output 'parametro - stazione'
  */
  private _createNameWithStationOld(name: string, stazione: Stazioni): string {
    return `${name} - ${stazione.name}`;
  }

  /**
  * @description Metodo che ritorna un observable di tipo IResponseAllValidata[]
   * @param value TypeValueToSpecialistico
   * @param all lista di Parametri
   * @param stazioni lista di Stazioni
   * @param db  UserStateLock
   * @param periodo IStatePeriodo
   * @param parametri Parametri[]
   * @private
   * @returns Observable<IResponseAllValidata[]>
   * @example
   * this._getListObservable(all, db, periodo) // Observable<IResponseAllValidata[]>
  */
  private _getListObservable({value,periodo,db, parametri}:IParametriGetListObservable) {
    let list = parametri?.map(({parametro: {name, key,measurementPeriod},stazione, ...item}) => this.getObservable(value,db, {key,name: this._createNameWithStationOld(name, stazione),periodo:periodo!,measurementPeriod}) ) ?? [];
    // let listParametri = parametri?.map(({parametro: {name, key}, ...item}) => ({...item, name: this._createNameWithStation(stazioni, key, name)}) ) ?? [];
    // all = all.map(({name, ...item}) => ({...item, name: this._createNameWithStation(stazioni, item.key, name)}) );
    // let list = listParametri.map(({measureUnitId, beginDate, endDate, name, key, measurementPeriod}) =>
    //   this.getObservable(value, db, {key, measurementPeriod, name, periodo: periodo!}));
    return forkJoin(list);
  }

  /**
  * @description Metodo che ritorna un observable di tipo Observable<IResponseAllValidata>
   *   @param value TypeValueToSpecialistico
   *   @param db  UserStateLock
   *   @param parmas IValue
   *   @example
   *   this.getObservable(db, key, periodo, measurementPeriod, name) // Observable<IResponseAllValidata>
  */
  private getObservable(value: TypeValueToSpecialistico, db: "cop" | "reg" | undefined, {key, measurementPeriod, name, periodo}: IValue){
    return this.reportService.getService(value, db, {
      sensorId: key,
      startDate: new Date(periodo.dataInizio).getTime().toString() ?? '',
      endDate: new Date(periodo.dataFine).getTime().toString() ?? '',
      period_m: measurementPeriod.toString()
    }, name)

  }
}
