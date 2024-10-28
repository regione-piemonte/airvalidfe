/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {map, withLatestFrom} from 'rxjs';
import {AppState} from "../../index";
import {Store} from "@ngrx/store";
import {changeShowNotValidDataParametroAction, notChangeParametroAction, selectParametroTypeAction} from "@actions/parametri.actions";
import {parametroSelector} from "@selectors/*";

@Injectable()
export class ActionsParametersEffects {

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store<AppState>
  ) {
  }

  changeAction$ = createEffect(() =>
    this.actions$.pipe(
      ofType(selectParametroTypeAction),
      withLatestFrom(this.store.select(parametroSelector)),
      map(([change, parametro]) => {
        switch (change.action) {
          case 'showNotValidData':
            return changeShowNotValidDataParametroAction(true);
          case 'notShowNotValidData':
            return changeShowNotValidDataParametroAction(false);
          default:
            return notChangeParametroAction();
        }
      })
    )
  );
}
