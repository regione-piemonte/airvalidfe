/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {MatDialog, MatDialogConfig, MatDialogRef,} from '@angular/material/dialog';
import {DataService, LanguageService, LocalService, ThemeLayoutService, UserSettingService,} from '../../services';
import {DatalocksService, SettingsService} from '../../services/api';
import {combineLatestWith, filter, map, Observable, switchMap, take, withLatestFrom} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar'
import {AppState} from "../../../state";
import {Store} from "@ngrx/store";
import {changesMassiveSelector, parametriSelector, stateLockValidazioneSelector} from "@selectors/*";
import {changePeriodAction, registrazioneParametroAction, setInputChangedDettaglioAction} from "@actions/*";
import {IParameter} from "@models/dataService";
import {DialogInitConfigComponent} from "@components/shared/dialogs/dialog-init-config/dialog-init-config.component";
import {Moment} from "moment";
import {environment} from "@environments/environment";
import {DialogService} from "@components/shared/dialogs/services/dialog.service";
import {tap} from "rxjs/operators";
import {ActivatedRoute, Route, Router, Routes} from "@angular/router";

/**
 * Represents the configuration for initializing data.
 * @interface
 */
export interface IDataInitConfig {
  startDate: Moment;
  endDate: Moment;
  lavoro: string;
}

export interface IPathRouter {
  name: any;
  path: string;
  icon: string;
  disabled: boolean;
}

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss'],
})
export class SideBarComponent implements OnInit {
  @Output() cssRefresh = new EventEmitter<boolean>();

  location = location;
  openClose: boolean = true;
  saveLayout: boolean = false;
  sideMenuItems: Array<IPathRouter> = [];
  path = environment.path_new_tab;

  constructor(
    private _translateService: TranslateService,
    private languageService: LanguageService,
    private readonly userService: UserSettingService,
    private readonly dataLockService: DatalocksService,
    private layoutService: ThemeLayoutService,
    private settingService: SettingsService,
    private dialog: MatDialog,
    private readonly localService: LocalService,
    private _snackBar: MatSnackBar,
    private storeService: Store<AppState>,
    private dataService: DataService,
    private dialogService: DialogService,
    private readonly router: Router,
  ) {
    this.userService
      .getTriggerSubject()
      .subscribe((value) => (this.saveLayout = value));
  }

  openCloseMenu() {
    this.openClose = !this.openClose;
    this.cssRefresh.emit(this.openClose);
  }

  ngOnInit(): void {
    this.languageService.currentLanguage$.subscribe((language: string) => {
      this._translateService.getTranslation(language).subscribe((res: any) => {
        this.sideMenuItems = [
          {
            name: res.main_menu.validazione,
            path: 'validazione',
            icon: 'event_available',
            disabled: false,
          },
          {
            name: res.main_menu.reportistica,
            path: 'reportistica',
            icon: 'insert_drive_file',
            disabled: false,
          },
          {
            name: res.main_menu.elaborazione,
            path: 'elaborazione',
            icon: 'area_chart',
            disabled: false

          },
        ]
      })
    })
    this.userService.layoutChanged$.subscribe((value: any) => {
      // console.info(value, 'value');
      this.userService.setTriggerSubject(true);
    });
  }

  saveLayoutSubmit() {
    this.layoutService.validazioneLayout$
      .pipe(
        take(1),
        switchMap((newLayout) => {
          // Esegui il secondo subscribe solo quando newLayout è disponibile
          return this.userService.setting$.pipe(
            map((response) => {
              const mergedLayout = {
                ...response,
                layout: {
                  ...response?.layout,
                  ...newLayout,
                },
              };
              const body = {
                groupId: 'settings',
                id: 'settingapp',
                type: 4,
                value: JSON.stringify(mergedLayout),
              };

              return this.settingService.setConfigApp(body).subscribe({
                next: (res: any) => {
                  // console.info('res', res);
                  const message = this._translateService.instant('snackbar.setting.success');
                  this._snackBar.open(message, '', {
                    duration: 1000,
                    panelClass: ['snackbar--success']
                  });
                },
                error: (err: any) => {
                  // console.info('res', err);
                  const message = this._translateService.instant('snackbar.setting.error');
                  this._snackBar.open(message, '', {
                    duration: 1000,
                    panelClass: ['snackbar--danger']
                  });
                },
                complete: () => {
                  // console.info('end');
                  this.userService.setTriggerSubject(false);
                },
              });
            })
          );
        })
      )
      .subscribe();
  }

  changePeriodo() {
    this.storeService.select(stateLockValidazioneSelector).pipe(
      filter(lista => !!lista.length),
      withLatestFrom(this.storeService.select(changesMassiveSelector)),
      switchMap(([state, lista]) => {
        const dialogConfig = new MatDialogConfig();
        // Controllo che non ci siano cambi massivi o cambi nel dataService
        if (lista.length || this.dataService.getToSaveValue().size > 0) {
          return this.dialogService.openInfoDialog(
            'Attenzione',
            'Sono presenti dati modificati. <br/>Procedere con il salvataggio o ripristinare il dataset'
          );
        }
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = true;
        dialogConfig.data = {
          id: 1,
          title: 'Selezione parametri',
        };

        const dialogRef: MatDialogRef<DialogInitConfigComponent, IDataInitConfig> = this.dialog.open(DialogInitConfigComponent, dialogConfig);
        dialogRef.componentInstance.form.patchValue({
          lavoro: 'validazione',
        });
        dialogRef.componentInstance.showStep2 = true;
        return dialogRef.afterClosed();
      }),
      take(1),
      filter(data => !!data),
      withLatestFrom(this.storeService.select(parametriSelector)),
      map(([data, lista]) => {
        // console.info('result', data);
        return [data, lista] as [IDataInitConfig, IParameter[]];
      }),
      switchMap<[IDataInitConfig, IParameter[]], Observable<{ result: IDataInitConfig, parametri?: Array<IParameter> }>>(([result, parametri]) => this.dataLockService.deleteUserStateLock().pipe(
          map(() => ({result, parametri}))
        )
      ),

    ).subscribe({
      next: ({parametri, result}) => {
        this.storeService.dispatch(changePeriodAction(true));
        this.localService.setDateStore('lavoro', result.lavoro);
        this.storeService.dispatch(registrazioneParametroAction({parametri: parametri!, reload: true, nuovoPeriodo: result}));
        this.storeService.dispatch(setInputChangedDettaglioAction({index: undefined, dataset: undefined ,changedDataset: undefined, parameter: undefined}));

      }
    })

  }

  ricaricaValidazione() {
    this.dataLockService.deleteUserStateLock().subscribe(() => {
      this.localService.clear();
      location.replace('');
    });
  }

  /**
   * @description Prende il path e verifichiamo che non sia la stessa in qui già siamo
   * @param {string} path - Riceve il path di navigazione per nuova tab, da verificare se esiste nella stessa
   * @return boolean
   * @example this._isLocation('validazione')
   */
  private _isLocation(path: string): boolean {
    return location.pathname.includes(path);
  }

  openNew(path: string) {
    if (!path) {
      throw new Error('path is missing');
    }
    try {
      window.open(`${this.path}/?lavoro=${path}`);
    } catch (e) {
      console.error('Error opening new window:', e);
    }

  }

  openSearchAnagrafica() {
    this.router.navigate(['ricerca_eventi_anagrafica']);
  }
}
