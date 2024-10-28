/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from '@angular/core';
import {forkJoin, map, Observable, of, switchMap, take} from "rxjs";
import {TranslateService} from "@ngx-translate/core";
import {TypeFork} from "@components/shared/dialogs/dialog-render-table-component/model/render.model";
import {ToggleGroup} from "@dialog/*";
import {IParameter} from "@models/dataService";
import {changesMassiveSelector, parametroSelector} from "@selectors/*";
import {deleteParametroAction} from "@actions/*";
import {Store} from "@ngrx/store";
import {AppState} from "../../../state";
import {DataService} from "@services/core/data/data.service";
import {DialogService} from "@components/shared/dialogs/services/dialog.service";

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  constructor(
    private translateService: TranslateService,
    private storeService: Store<AppState>,
    private dataService: DataService,
    private dialogService: DialogService,
  ) { }

  getAllTranslations<T>() {
    return forkJoin<Record<keyof TypeFork<T>, Observable<Array<ToggleGroup>>>>({
      renderTableReportistica: this.translateService.get('button.group.scelta_render'),
      renderTableReportisticaSpecialistica: this.translateService.get('button.group.scelta_render_specialistico'),
      renderTableElaborazione: this.translateService.get('button.group.scelta_elaborazione.toggle_group')
    })
  }

  /**
   * Controlla se è sicuro procedere con l'eliminazione dell'elemento fornito.
   * Se ci sono modifiche non salvate, viene visualizzata una finestra di dialogo informativa per confermare l'azione.
   *
   * @param {IParameter} item - L'elemento da eliminare.
   * @return {Observable<boolean>} Un observabile che emette true se l'elemento è stato eliminato, false altrimenti.
   */
  checkDelete(item?: IParameter): Observable<boolean> {
    return  this.storeService.select(changesMassiveSelector)
      .pipe(
        take(1),
        switchMap(change => {
          let message = "Procedere con l'eliminazione?";
          if (change && change.length || this.dataService.getIsSaved()) {
            message = 'Ci sono dati da salvare, vuoi procedere?';
          }
          return this.dialogService
            .openInfoDialog(
              'Attenzione',
              message,
              'Elimina'
            ).pipe(
              switchMap((res) => {
                if (res) {
                  this.dataService.clearAllValue();
                  if (item) {
                    // Pulisco il valore del Map
                    // Faccio un dispatch per cambiare il valore della tipo action
                    this.storeService.dispatch(deleteParametroAction(item));
                  }
                  // Devo emettere l'evento per dire che la serie è stata eliminata
                  // this.visibilityNotValidDataSeries.emit(null);

                  //return of(true);
                } else {
                  //return of(false);
                }

                return of(!!res)
              }),
            )
        }),
      )
  }


  /**
   * Questo metodo verifica se il/i parametro/i fornito/i sono già selezionati.
   *
   * Seleziona il parametro corrente utilizzando il `parametroSelector` dallo store e mappa il risultato a un booleano
   * che indica se uno degli elementi forniti corrisponde al parametro selezionato.
   *
   * @param {Array<IParameter>} item - I parametri da controllare rispetto al parametro selezionato.
   * @return {Observable<boolean>} Un observable che emette `true` se uno degli elementi forniti corrisponde al parametro selezionato,
   *                                altrimenti `false`.
   */
  checkIfParametroSelezionato(item: Array<IParameter>):Observable<boolean>  {
    return this.storeService.select(parametroSelector).pipe(
      take(1),
      map(parametro => parametro !== null && parametro !== undefined && item.some(par => par.parametro.key === parametro.parameter.parametro.key))
    );
  }
}
