/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from "@angular/core";
import {Actions, createEffect, ofType} from "@ngrx/effects";
import {Store} from "@ngrx/store";
import {AppState} from "../../index";
import {deleteReportAction, newStateREportisticaAction} from "@actions/*";
import {map, withLatestFrom} from "rxjs";
import {parametroSelector, reportisticaFeatureSelector} from "@selectors/*";


@Injectable()
export class DeleteReportisticaEffects {


  constructor(
    private readonly actions$: Actions,
    private readonly store:Store<AppState>
  ) {
  }


  /**
  * @description Creo un effect che ascolta la action deleteReportAction
  */
  deleteParametroToGrafico$ = createEffect(() => this.actions$.pipe(
    ofType(deleteReportAction),
    withLatestFrom(this.store.select(reportisticaFeatureSelector)),
    map(([{records}, state]) => ({records, state})),
    map(({records, state}) => {

      let copyState = {...state};
      for (const recordsKey in records) {
        if (state.hasOwnProperty(recordsKey)) {

          records[recordsKey].forEach(itemRecord => {
            // @ts-ignore
            copyState[recordsKey] = copyState[recordsKey].filter(item => item.formato !== itemRecord.formato);
          })
        }
      }

      if (state.listStandardReport?.length) {
        copyState.listStandardReport = []
      }


      return newStateREportisticaAction(copyState)
    }),

  ))
}
