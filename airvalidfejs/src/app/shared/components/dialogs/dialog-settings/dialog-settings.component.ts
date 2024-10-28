/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {AfterViewInit, Component, OnInit} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog'
import {MatTableDataSource} from '@angular/material/table'
import {DialogInfoComponent, DialogParametersComponent} from '@dialog/*';
import {NgxSpinnerService} from 'ngx-spinner';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms'
import {catchError, combineLatest, EMPTY, forkJoin, iif, map, mergeMap, Observable, of, switchMap, take} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {LanguageService, ThemeColorService, ThemeFontService, ThemeLayoutService, UserSettingService} from '../../../../core/services';
import {IResponseConfig, NetworksService, SettingsService} from '@services/core/api';
import {Col, IUserSetting} from '@models/user-settinng.interface';
import {MatSnackBar} from '@angular/material/snack-bar'
import {TranslateService} from '@ngx-translate/core'
import {MatCheckboxChange} from '@angular/material/checkbox';

@Component({
  selector: 'app-dialog-settings',
  templateUrl: './dialog-settings.component.html',
  styleUrls: ['./dialog-settings.component.scss']
})
export class DialogSettingsComponent implements OnInit, AfterViewInit {
  supportedLanguages = ['gb', 'it']; // Aggiungi le lingue supportate
  tablePreset = new MatTableDataSource<string>();
  listaAreeTerritoriali$: Array<any> = [];
  rete$ = new Observable<IResponseConfig>();
  areeTerritoriali: Array<any> = [];
  displayedColumns = [
    //'id',
    'name',
    //'rete',
    //'stazioni',
    //'parametri',
    'azioni'
  ]
  form!: FormGroup;
  selectPreset: Array<any> = [];
  private _deleteArray: Array<string> = [];

  constructor(
    private _languageService: LanguageService,
    private dialogRef: MatDialogRef<DialogParametersComponent>,
    private _spinnerService: NgxSpinnerService,
    private settingService: SettingsService,
    private _settingPrefService: UserSettingService,
    private _layoutService: ThemeLayoutService,
    private _themeColorService: ThemeColorService,
    private _themeFontService: ThemeFontService,
    private fb: FormBuilder,
    private readonly matDialogService: MatDialog,
    private _snackBar: MatSnackBar,
    private _translate: TranslateService,
    private _networkService: NetworksService
  ) {
    this._networkService.getNetworksName().pipe(take(1)).subscribe((network) => {
      return this.listaAreeTerritoriali$ = network
    });
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      languageRadioControl: new FormControl([''], Validators.required),
      themeRadioControl: new FormControl([''], Validators.required),
      layoutRadioControl: new FormControl([''], Validators.required),
      fontRadioControl: new FormControl([''], Validators.required),
    })

  }

  ngAfterViewInit(): void {
    this.rete$ = this.settingService.getConfigApp();
    this.getConfigs();
  }


  close() {
    if (this._deleteArray.length > 0) {
      let dialog = this.matDialogService.open(DialogInfoComponent, {
        data: {
          title: 'Attenzione',
          message: 'Ci sono preset da eliminare, vuoi continuare?',
          role: 'alert',
          actionButton: 'Elimina e chiudi',
        }
      })

      dialog.afterClosed()
        .pipe(
          switchMap<string, Observable<string>>(res => {
              return iif(() => !!res,
                this._deleteAllElementToArray().pipe(
                  mergeMap((response) => of(res))
                ),
                of(res)
              )
            }
          ),
          finalize(() => this.dialogRef.close())
        )
        .subscribe(res => {
          if (!!this._deleteArray.length) {
            this._deleteArray = [];
          }
        });
    } else {
      this.dialogRef.close();
    }
  }

  getConfigs() {
    this._spinnerService.show('global');
    let layout$ = this._layoutService.validazioneLayout$;
    let configList$ = this.settingService.getConfigList();
    let currentLanguage$ = this._languageService.currentLanguage$;
    let themeColor$ = this._themeColorService.currentColor$;
    let themeFont$ = this._themeFontService.currentFont$;
    combineLatest([layout$, configList$, this.rete$, currentLanguage$, themeColor$, themeFont$])
      .pipe(
        take(1)
      )
      .subscribe(([layout, lista, rete, language, themeColor, themeFont]) => {
        this.tablePreset.data = lista;
        this.form.get('layoutRadioControl')!.setValue(layout!.set);
        this.form.get('languageRadioControl')!.setValue(language);
        this.form.get('themeRadioControl')!.setValue(themeColor);
        this.form.get('fontRadioControl')!.setValue(themeFont);
        const defRete = JSON.parse(rete!.value);
        this.areeTerritoriali = defRete.areeTerritoriali
          ? defRete.areeTerritoriali
          : "";
        this._spinnerService.hide('global');
      });
  }

  compareobj(o1: any, o2: any): boolean {
    return o1.key === o2.key && o1.name === o2.name;
  }

  onSubmit() {
    // Se ci sono elementi eliminati dalla lista dei preset entro in questa condizione
    if (this._deleteArray.length) {
      this._deleteAllElementToArray()
        .subscribe(res => {
          // console.info( res );
          // resetto l'array di elementi da eliminare
          this._deleteArray = [];
          this.close();

        });
    }

    this._layoutService.validazioneLayout$.pipe(
      take(1),
      switchMap(valueLayout => {
        const {col, default: defaultLayout, reverse} = valueLayout || {};
        let config = this.generateDialogSettings(defaultLayout, reverse, col)
        return this.postConfig(config).pipe(
          map(response => ({response, valueLayout}))
        )
      }),
      switchMap(({response, valueLayout}) => {
        console.info(response);
        return this.settingService.getConfigApp().pipe(
          map(newConfig => ({newConfig, valueLayout})),
        );
      }),
      catchError(error => {
        const message = this._translate.instant('snackbar.setting.error');
        this._snackBar.open(message, '', {
          duration: 1000,
          panelClass: ['snackbar--danger']
        });
        return EMPTY;
      })
    )
      .subscribe(
        ({newConfig, valueLayout}) => {
          let body: IUserSetting = JSON.parse(newConfig.value);
          if (body.layout.set !== valueLayout!.set) {
            // Non lancio la modifica rimando al reload
            console.info('Apro modal per avvisare');
            this.matDialogService.open(DialogInfoComponent, {
              data: {
                title: this._translate.instant('snackbar.setting.reload.title'),
                message: this._translate.instant('snackbar.setting.reload.message')
              }
            });
          } else {
            this._settingPrefService.getConfigApp(JSON.parse(newConfig.value));
          }

          const message = this._translate.instant('snackbar.setting.success');
          this._snackBar.open(message, '', {
            duration: 1000,
            panelClass: ['snackbar--success']
          });
          this.dialogRef.close();
        },
        (error) => {
        },
        () => {

          this._settingPrefService.setTriggerSubject(false);

        }
      )
  }

  private generateDialogSettings(defaultLayout?: Col, reverse?: Col, col?: Col) {
    let {languageRadioControl, themeRadioControl, fontRadioControl, layoutRadioControl} = this.form.value;
    return {
      "lang": languageRadioControl,
      "theme": themeRadioControl,
      "font": fontRadioControl,
      "layout": {
        "set": layoutRadioControl,
        default: {
          ...defaultLayout,
        },
        reverse: {
          ...reverse,
        },
        col: {
          ...col,
        },
      },
      areeTerritoriali: this.areeTerritoriali,
    };
  }

  postConfig(config: IUserSetting): Observable<number> {
    const body: IResponseConfig = {groupId: "settings", id: "settingapp", type: 4, value: JSON.stringify(config)}

    return this.settingService.setConfigApp(body)
    // .subscribe({
    //   next: (res: any) => {
    //     // console.info('res', res);
    //   },
    //   error: (err: any) => {
    //     // console.info('res', err);
    //   },
    //   complete: () => {
    //
    //     this.settingService.getConfigApp().subscribe({
    //       next: (res: any) => {
    //         this._settingPrefService.getConfigApp(JSON.parse(res.value));
    //       },
    //       error: (err: any) => {
    //         // console.info('res', err);
    //       },
    //       complete: () => {
    //         this._settingPrefService.setTriggerSubject(false);
    //
    //       }
    //     });
    //
    //     this.dialogRef.close();
    //
    //   },
    // });
    // this.dialogRef.close();
  }

  /**
   * @description Elimina tutti gli elementi presenti nell'array e poi chiude la modal
   */
  private _deleteAllElementToArray() {
    // prima di chiudere la modal devo eliminare i preset che sono stati eliminati
    let listObservable$ = this._deleteArray.map(element => this.settingService.deleteConfig(element));
    return forkJoin([...listObservable$])
  }

  /**
   * @description Resetta tutti i servizi che hanno a che fare con la configurazione
   * @returns void
   *
   */
  private _resetAllConfigService() {
    this._layoutService.setValidazioneLayout(this.form.value.layoutRadioControl);
    this._languageService.setLanguage(this.form.value.languageRadioControl);
    this._themeColorService.setThemeColor(this.form.value.themeRadioControl);
    this._themeFontService.setThemeFont(this.form.value.fontRadioControl);
  }

  selectAll(
    event: MatCheckboxChange,
    param: string,
    arraySelect: Array<Object> = []
  ) {
    this.form.get(param)?.setValue(event.checked ? [...arraySelect] : []);
  }

  deleteConfig(element: string) {
    // Elimina l'element dalla lista
    this.tablePreset.data = this.tablePreset.data.filter((value, index, arr) => {
      if (value != element) {
        // mando il value nel array da eliminare
        return true;
      }
      this._deleteArray.push(value);
      return false;
    });
  }

}
