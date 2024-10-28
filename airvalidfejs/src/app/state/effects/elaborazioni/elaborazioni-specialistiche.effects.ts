/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from "@angular/core";
import {Actions, createEffect, ofType} from "@ngrx/effects";
import {Store} from "@ngrx/store";
import {AppState} from "../../index";
import {
  saveReportIdSpecialisticoElaborazioneAction,
  saveYearsToSpecialisticoElaborazioneAction,
  seccessStationElaborazioniAction,
  selectedDateElaborazioneAction,
  selectParametersSpecialisticaElaborazione,
  selectReportSpecialisticoElaborazioneAction,
  selectReteSpecialisticaElaborazioneAction,
  selectSensorsSpecialisticaElaborazioneAction,
  selectStazioneSpecialisticaElaborazioneAction,
  successAnagraphElaborazionieAction,
  successGetParametersElaborazioneAction,
  successSensorElaborazioniAction
} from "@actions/*";
import {filter, map, of, switchMap, tap, withLatestFrom} from "rxjs";
import {idReportAndTime, idReportSpecialisticoAndDbElaborazioneSelector, idReportSpecialisticoElaborazione,} from "../../selectors/elaborazione-specialistica.selectors";
import {ReportisticaService} from "@services/core/api";


@Injectable()
export class ElaborazioniSpecialisticheEffects {


  constructor(
    private readonly actions$: Actions,
    private readonly store: Store<AppState>,
    private readonly _reportisticaService: ReportisticaService,
  ) {
  }


  getReportToSelected = createEffect(() => this.actions$.pipe(
    ofType(selectReportSpecialisticoElaborazioneAction),
    withLatestFrom(this.store.select(idReportSpecialisticoElaborazione)),
    map(([{id_report}, idState]) => ({id: id_report, idState})),
    filter(({idState, id}) => id !== idState),
    switchMap(({id}) => {
      return this._reportisticaService.getSpecificaSelected(id).pipe(
        map(({timePeriod}) => ({id, timePeriod}))
      )
    }),
    map(({timePeriod, id}) => {
      return saveReportIdSpecialisticoElaborazioneAction(id, timePeriod);
    })
  ))

  getNetWorkOfDate$ = createEffect(() => this.actions$.pipe(
    ofType(selectedDateElaborazioneAction),
    withLatestFrom(this.store.select(idReportSpecialisticoAndDbElaborazioneSelector)),
    tap(response => console.log(response, 'Effect Elaborazione')),
    filter(([date, {db, idReport: id}]) => !!id),
    switchMap(([{date}, {db, idReport: id}]) => {
      return this._reportisticaService.getAnagraphData(id!, {
        beginTime: date.begin.toString(),
        endTime: date.end.toString(),
        dbId: db
      })
    }),
    map(response => successAnagraphElaborazionieAction(response))
  ))

  getNetwork$ = createEffect(() => this.actions$.pipe(
    ofType(saveYearsToSpecialisticoElaborazioneAction),
    withLatestFrom(this.store.select(idReportSpecialisticoElaborazione)),
    filter(([anni, id]) => !!id),
    switchMap(([{anni}, id]) => {
      return this._reportisticaService.getAnagraphData(id!, {
        beginTime: anni.firstYearValueString,
        endTime: anni.secondYearValueString,
      })
    }),
    map(response => successAnagraphElaborazionieAction(response))
  ))

  getStazioni$ = createEffect(() => this.actions$.pipe(
    ofType(selectReteSpecialisticaElaborazioneAction),
    withLatestFrom(this.store.select(idReportAndTime)),
    switchMap(([{reti}, {id, anni, time, date, db}]) => {

      let timeUnitIsDate = time?.timeUnit === 'DATE';


      return this._reportisticaService.getAnagraphData(
        id!, {
          beginTime: timeUnitIsDate ? date!.begin.toString() : anni!.firstYearValueString,
          endTime: timeUnitIsDate ? date!.end.toString() : anni!.secondYearValueString,
          itemType: 'NETWORK',
          itemIds: reti,
          dbId: db
        })
    }),
    map(response => seccessStationElaborazioniAction(response))
  ))

  getParametriSpecialisticoElaborazioneAction$ = createEffect(() => this.actions$.pipe(
    ofType(selectParametersSpecialisticaElaborazione),
    withLatestFrom(this.store.select(idReportAndTime)),
    switchMap(([{parametri, tipo}, {date, id, anni, time, db}]) => {
      let timeUnitIsDate = time?.timeUnit === 'DATE';


      return this._reportisticaService.getAnagraphData(
        id!, {
          beginTime: timeUnitIsDate ? date!.begin.toString() : anni!.firstYearValueString,
          endTime: timeUnitIsDate ? date!.end.toString() : anni!.secondYearValueString,
          itemType: tipo,
          itemIds: parametri,
          dbId: db
        })
    }),
    map(response => successGetParametersElaborazioneAction(response))
  ))

  getParametri$ = createEffect(() => this.actions$.pipe(
    ofType(selectStazioneSpecialisticaElaborazioneAction),
    withLatestFrom(this.store.select(idReportAndTime)),
    switchMap(([{stazioni, complete}, {id, anni, time, date, db}]) => {
      if (!complete) {
        let timeUnitIsDate = time?.timeUnit === 'DATE';
        return this._reportisticaService.getAnagraphData(
          id!, {
            beginTime: timeUnitIsDate ? date!.begin.toString() : anni!.firstYearValueString,
            endTime: timeUnitIsDate ? date!.end.toString() : anni!.secondYearValueString,
            itemType: 'STATION',
            itemIds: stazioni,
            dbId: db
          })
      }
      return of({stazioni, complete})
    }),
    map(response => {
      if ('complete' in response && 'stazioni' in response) {
        return selectSensorsSpecialisticaElaborazioneAction(response.stazioni, 'STATION');
      }
      let copyResponse = {...response};
      let {items, ...resp} = copyResponse;
      let copy = items.reduce((acc, {name, key, ...obj}) => {

        // @ts-ignore
        if (!acc[name]) {

          // @ts-ignore
          acc[name] = {
            name, keys: [],
            ...obj
          }
        }
        // @ts-ignore
        acc[name].keys.push(key);
        return acc;
      }, {
        [items[0].name]: {...items[0], keys: [] as string[]}
      });
      const parametri = Object.values(copy);

      copyResponse = {...copyResponse, itemsKeys: parametri};

      return successSensorElaborazioniAction(copyResponse)
    })
  ))


}
