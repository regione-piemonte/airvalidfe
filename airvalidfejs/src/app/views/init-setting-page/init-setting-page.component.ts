/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Component, Inject, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig, MatDialogRef} from "@angular/material/dialog";
import {DialogInitConfigComponent} from "@components/shared/dialogs/dialog-init-config/dialog-init-config.component";
import {filter, map, Observable, withLatestFrom} from "rxjs";
import {parametriDialogSelector} from "@selectors/*";
import {AppState, IResponseLimiti} from "../../state";
import {Store} from "@ngrx/store";
import {ActivatedRoute, Router} from "@angular/router";
import {IConfigDialogParameter, IData} from "@models/validazione";
import {DialogParametersComponent} from "@components/shared/dialogs/dialog-parameters/dialog-parameters.component";
import {
  addParametriElaborazioniAction,
  addParametriReportisticaAction,
  caricaLimitDaStoreValidazioneAction,
  registrazioneParametroAction,
  resetStoreElaborazioneSpecialistico
} from "@actions/*";
import {DataService} from "@services/core/data/data.service";
import {LocalService} from "@services/core/locale/local.service";
import {IParameter} from "@models/dataService";
import {LIMIT} from "../../app.module";

export type IRecordsType = Record<'lavoro', 'reportistica' | 'validazione' | 'elaborazione'>;

@Component({
  selector: 'app-init-setting-page',
  templateUrl: './init-setting-page.component.html',
  styleUrls: ['./init-setting-page.component.scss']
})
export class InitSettingPageComponent implements OnInit {

  constructor(
    private readonly router: Router,
    private readonly navigate: ActivatedRoute,
    public matDialog: MatDialog,
    public storeService: Store<AppState>,
    private dataService: DataService,
    private readonly localService: LocalService,
    @Inject(LIMIT) private readonly limitService: Observable<Array<IResponseLimiti>>
  ) {
  }

  private _openDialog(paramas: boolean = false, path?: IRecordsType): MatDialogRef<DialogInitConfigComponent, {
    lavoro: string;
    endDate: string;
    startDate: string;
    "tipoElaborazione": string;
  }> {
    return this.matDialog.open(DialogInitConfigComponent, {
      disableClose: true,
      autoFocus: true,
      data: {
        id: 1,
        title: 'Configurazione iniziale',
        showStep2: paramas,
        path: path?.lavoro
      }
    });
  }

  ngOnInit(): void {

    this.storeService.dispatch(resetStoreElaborazioneSpecialistico());
    this.limitService.subscribe(limiti => this.storeService.dispatch(caricaLimitDaStoreValidazioneAction(limiti)))
    this.navigate.queryParams
      .pipe(
        //filter((params: Params) => Object.keys(params).length > 0),
      )
      .subscribe(params => {
        this._openDialog(!!Object.keys(params).length, !!Object.keys(params).length ? params as IRecordsType : undefined)
          .beforeClosed()
          .pipe(
            filter(data => !!data),
            withLatestFrom(this.storeService.select(parametriDialogSelector)),
            map(([data, parametri]) => ({data, parametri})),
          )
          .subscribe({
            next: ({data, parametri}) => {
              let {lavoro, tipoElaborazione} = data!;

              if (tipoElaborazione === 'specialistica') {
                this.router.navigate([`/${lavoro}/${tipoElaborazione}`])
              } else {
                this.localService.setDateStore('lavoro', lavoro ?? '');
                this.router.navigate([`/${lavoro}`]).then(() => this.openDialogParameters());
              }
            },
            error: (error) => {
              console.error(error);
            },
            complete: () => {
              console.log('Complete');
            }
          });

      })

  }

  openDialogParameters(): void {
    const dialogConfig: MatDialogConfig<IConfigDialogParameter> = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1,
      title: 'Selezione parametri',
    };

    const dialogRef: MatDialogRef<DialogParametersComponent, IData> = this.matDialog.open(DialogParametersComponent, dialogConfig);
    dialogRef
      .afterClosed()
      .pipe(
        filter(data => !!data),
      )
      .subscribe((data) => {
        // Creo params come arrau vuoto
        let params: IParameter[] = [];
        // console.info(data);
        let {selected, all} = data!;
        // Nel caso che all sia vuoto
        if (all.length === 0) {
          params = selected.parametri.map((element, i) => {
            return this.dataService.createParameter(i, selected, element);
          })
        }else{
          params = [
            ...all.filter(({name}) => selected.parametri
              .some(({name: nameSelected}) => nameSelected === name))
              .map((element) => this.dataService.createParameter(0, selected, element))
          ];
        }
        let url = this.router.url;
        if (url.includes('validazione')) {
          this.storeService.dispatch(registrazioneParametroAction({parametri: params, reload: false}));
        }
        if (url.includes('reportistica')) {
          this.storeService.dispatch(addParametriReportisticaAction(params));
        }
        if (url.includes('elaborazione')) {
          this.storeService.dispatch(addParametriElaborazioniAction(params))
        }
      });
  }

}
