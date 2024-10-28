/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from "@angular/core";
import {Actions, createEffect, ofType} from "@ngrx/effects";
import {
  addNewParameterToListElaborazioneAction, addNewTimeToListGraficiElaborazioneAction, callParametroCorrelatoElaborazioneAction,
  changeValoreFlagVerificationLevel,
  setDataToGraficiElaborazioneAction,
  setTypeGraficoElaborazioneAction
} from "@actions/*";
import {filter, forkJoin, map, Observable, switchMap, withLatestFrom} from "rxjs";
import {Store} from "@ngrx/store";
import {AppState} from "../../index";
import {getGraficiAndDatiStateElaborazioniSelector, requestOfGetElaborazioneSelector} from "@selectors/*";
import {ReportisticaService, SensorsService, UserStateLock} from "@services/core/api";
import {finalize} from "rxjs/operators";
import {DateSettingService} from "@services/core/utility/date-setting.service";
import {DataService} from "@services/core/data/data.service";
import {IParameter} from "@models/dataService";
import {NgxSpinnerService} from "ngx-spinner";
import {IGraficiElaborazioni} from "@reducers/*";
import {IData} from "@models/validazione";
import {UtilityClass} from "@components/shared/utily/utily.class";

@Injectable()
export class ElaborazioniEffects {

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store<AppState>,
    private readonly elaborazioneService: ReportisticaService,
    private readonly settingDate: DateSettingService,
    private readonly dataService: DataService,
    private readonly spinnerService: NgxSpinnerService,
    private readonly sensorService: SensorsService,
  ) {
  }

  private _getElaborazione<T extends {tipo: string, valoreFlag: number}>(){
    return (source:Observable<T>) => source.pipe(
      withLatestFrom(this.store.select(requestOfGetElaborazioneSelector)),
      switchMap(([{tipo, valoreFlag}, {db, endDate, parametri, startDate}]) => {
        return this.getElaborazioniEffects(parametri,tipo, db,startDate, endDate,  valoreFlag.toString());
      }),
      map(valoriGrafici => setDataToGraficiElaborazioneAction(valoriGrafici))
    )
  }

  private getElaborazioniEffects(parametri:Array<IParameter>,  tipo: string, db:UserStateLock,startDate?: string, endDate?: string, flag: string = '2') {
    let gmtStart = this.settingDate.getGMT(startDate!);
    let gmtEnd: number = this.settingDate.getGMT(endDate!);
    return forkJoin([...parametri.map(parametro => {
      return this.elaborazioneService.getElaborazioni({
        type: tipo,
        dbId: db,
        sensorId: parametro.parametro.key!,
        beginDate: this.settingDate.createInitDay(new Date(+startDate!).toUTCString(), undefined, {hours: gmtStart === 2 ? 1 : 0, seconds: 0, minutes: 0}).getTime().toString(),
        endDate: this.settingDate.createInitDay(new Date(+endDate!).toUTCString(), undefined, {hours: gmtEnd === 2 ? 1 : 0, minutes: 0, seconds: 0}).getTime().toString()!,
        period_m: parametro.parametro.measurementPeriod.toString(),
        verificationLevel: flag,
        decimalDigits: parametro.parametro.decimalDigits.toString()
      }).pipe(
        map(response => {
          let measureUnitInfo = this.dataService.getUnitMeasure(+parametro.parametro.measureUnitId).extraInfo ?? '';
          // ...response,name: `${parametro.stazione.name} - ${parametro.parametro.name}`, id: parametro.parametro.key!, listResult: response.listResult?.flat().map(item => item.values ?? []).flat() ?? []
          return {
            ...response,
            unitaMisura: measureUnitInfo,
            name: `${parametro.stazione.name} - ${parametro.parametro.name}`,
            id: parametro.parametro.key!,
            listResult: response.listResult?.map(list => ({...list, name: `${parametro.stazione.name} - ${parametro.parametro.name} - ${list.description}`}))
          }
        }),
        finalize(() => {
          // this.spinnerService.hide('global')
        })
      )
    })])
  }

  getDatiElaborazioni$ = createEffect(() =>
    this.actions$.pipe(
    ofType(setTypeGraficoElaborazioneAction),
    // tap(() => console.info('effect chiamato')),
    filter(({tipo}) => !tipo.includes('new') ),
    this._getElaborazione(),
  ))

  getDatiElaborazione$ = createEffect(() => this.actions$.pipe(
    ofType(changeValoreFlagVerificationLevel),
    withLatestFrom(this.store.select(getGraficiAndDatiStateElaborazioniSelector)),
    map(([valore, {state, grafici}]) => ({valore, state, grafici})),
    switchMap(({valore, state, grafici}) => {
      // Ricerca il grafico
      let graphElement = grafici.find(item => item.indexTime === valore.indice);
      const {db, endDate, startDate='', parametri} = state;
      return this.getElaborazioniEffects(parametri, graphElement!.tipo, db, startDate, endDate, valore.valore.toString());
    }),
    map(valore => setDataToGraficiElaborazioneAction(valore))
    )
  )

  getDatiToNewParametriElaborazioni$ = createEffect(() => this.actions$.pipe(
    ofType(addNewParameterToListElaborazioneAction),
    withLatestFrom(this.store.select(getGraficiAndDatiStateElaborazioniSelector)),
    map(([parametri, {state, grafici}]) => ({...state,grafici, newParametri: parametri.parametri})),
    switchMap(({parametri, grafici, newParametri, db,startDate, endDate}) => {
      let validTypes = grafici.map(grafico => grafico.tipo).filter(tipo => !tipo.includes('new'));
      const observables = validTypes.map(tipo => this.getElaborazioniEffects(newParametri, tipo, db, startDate, endDate).pipe(
        map(data => ({data, tipo, grafici: grafici.find(grafico => grafico.tipo === tipo)}))
      ));
      return forkJoin(observables).pipe(
        // map(response => ({response})),
      );
    }),
    map((response) => {
      let grafici: IGraficiElaborazioni[] = response.map( ({grafici, data, tipo}) => ({...grafici!, data: [...grafici!.data, ...data]}));
      return addNewTimeToListGraficiElaborazioneAction(grafici);
    })
  ))

  getDatiToParametriCorrelati$ = createEffect(() => this.actions$.pipe(
    ofType(callParametroCorrelatoElaborazioneAction),
    switchMap(({key}) => this.sensorService.getSensoriCorrelati(key)),
    withLatestFrom(this.store.select(getGraficiAndDatiStateElaborazioniSelector)),
    map(([lista, store]) => {
      const {grafici, state} = store;
      const {db, startDate, endDate, parametri} = state;
      let {sensorNamesList, sensorNames, stationNames, networkNames} = this.dataService.createData(lista);

      let data: IData = {
        selected: {
          areeTerritoriali: networkNames,
          stazioni: stationNames,
          parametri: sensorNamesList,
        },
        all: sensorNames
      }

      let params = [
        ...data.all
          .filter(({name}) =>
            data.selected.parametri.some(
              ({name: nameSelected}) => nameSelected == name
            )
          )
          .map((element) => this.dataService.createParameter(0, data.selected, element) )
      ];

      const newestElement = UtilityClass.getElementToLastList(parametri, params);
      this.spinnerService.hide('global');
      return addNewParameterToListElaborazioneAction(newestElement)
    }),
  ))
}
