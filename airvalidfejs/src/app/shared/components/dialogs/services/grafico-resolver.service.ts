import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {catchError, EMPTY, mergeMap, Observable, of, retry, switchMap, take, tap, throwError,} from "rxjs";
import {ReportisticaService} from "@services/core/api";
import {Store} from "@ngrx/store";
import {AppState} from "../../../../state";
import {resolverSelector,} from "../../../../state/selectors/elaborazione-specialistica.selectors";
import {IResponseReportElaborazione} from "@services/core/api/reportistica/models/getResponseItem.model";
import {NgxSpinnerService} from "ngx-spinner";
import { MatDialog } from '@angular/material/dialog'
import { ProgressModalComponent } from '@components/shared/progress-modal/progress-modal.component'
import { progressElaborazioneSelector } from '@selectors/*'

@Injectable()
export class GraficoResolver implements Resolve<Observable<any>> {


  constructor(
    private readonly elaborazioneService: ReportisticaService,
    private readonly store: Store<AppState>,
    private spinner: NgxSpinnerService,
    private dialog: MatDialog
  ) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<IResponseReportElaborazione | { status: string; uuid: string }> {

    return this.store.select(resolverSelector).pipe(
      take(1),
      switchMap(({id, keys, anni, date, result = 'SENSOR', db}) => this.elaborazioneService.getReport(id!, {
          itemType: result,
          itemIds: keys,
          beginTime: date ? date.begin.toString() : anni!.firstYearValueString,
          endTime: date ? date.end.toString() : anni!.secondYearValueString,
          dbId: db
        }).pipe(
          tap((response) => {
            // Mostra la modale con il progresso
            const dialogRef = this.dialog.open(ProgressModalComponent, {
              data: { progress: 0 }, 
              disableClose: true,
              panelClass: 'progress-dialog' 
            });
            this.spinner.hide('global');

            // Ascolta gli aggiornamenti del progresso
            this.store.select(progressElaborazioneSelector).subscribe(progress => {
              dialogRef.componentInstance.progress = progress; // Aggiorna il progresso nella modale
            });
            // Do something with the response
            console.info(response, 'Report resolver');
          }),
          switchMap(({id: uuid}) => this.elaborazioneService.getStatusReport(uuid)
            .pipe(
              mergeMap(response => {
                  this.spinner.hide('global');
                  console.info(response, 'Report resolver repeat');
                  if ('status' in response) {
                    document.body.classList.add('className');
                    return throwError(() => 'Status resolver returned with status ' + response);
                  }
                  return of({...response, uuid});
                }
              ),
              retry(10),
              catchError((error) => {
                this.dialog.closeAll(); // Chiudi la modale in caso di errore
                return EMPTY;
              })
            )),
          tap((response) => {
            console.info('Report risolto completamente', response);
            document.body.classList.remove('className');
            this.dialog.closeAll();
          } ),
        )
      )
    )

  }
}
