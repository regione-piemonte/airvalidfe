/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {filter, map, withLatestFrom} from 'rxjs';
import {AppState} from "../../index";
import {Store} from "@ngrx/store";
import { deleteParametroSelezionatoAction, initReportisticaAction, initStateDettaglioAction} from "@actions/parametri.actions";
import {parametroSelector} from "@selectors/*";

@Injectable()
export class NavigationEffects {

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store<AppState>
  ) {
  }

  changeAction$ = createEffect(() =>
    this.actions$.pipe(
      ofType(initReportisticaAction),
      withLatestFrom(this.store.select(parametroSelector)),
      filter(([value, parametro]) => !!parametro),
      map(([value, parametro]) => {
        return deleteParametroSelezionatoAction(parametro!.parameter)
      }
    )
  ))

  deleteInputDettaglio$ = createEffect(() => this.actions$.pipe(
    ofType(deleteParametroSelezionatoAction),
    map(action => {
      // Elimino l'input dal dettaglio
      return initStateDettaglioAction()
    })
  ))
}
