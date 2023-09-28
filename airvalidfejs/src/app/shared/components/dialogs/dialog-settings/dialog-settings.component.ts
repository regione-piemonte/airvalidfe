/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component , OnInit } from '@angular/core';
import { MatDialog , MatDialogRef } from '@angular/material/dialog'
import { MatTableDataSource } from '@angular/material/table'
import { DialogParametersComponent } from '../dialog-parameters/dialog-parameters.component'
import { SettingsService } from 'src/app/core/services/api/settings/settings.service';
import { ThemeLayoutService } from 'src/app/core/services/utility/theme-layout.service'
import { FormBuilder , FormControl , FormGroup } from '@angular/forms'
import { LanguageService } from 'src/app/core/services/locale/language.service'
import { ThemeColorService } from 'src/app/core/services/utility/theme-color.service'
import { ThemeFontService } from 'src/app/core/services/utility/theme-font.service'
import { combineLatest , forkJoin , iif , map , mergeMap , Observable , of , switchMap , take } from 'rxjs';
import { DialogInfoComponent } from '../dialog-info/dialog-info.component';
import { ifStmt } from '@angular/compiler/src/output/output_ast';
import { finalize } from 'rxjs/operators';

@Component( {
  selector: 'app-dialog-settings' ,
  templateUrl: './dialog-settings.component.html' ,
  styleUrls: [ './dialog-settings.component.scss' ]
} )
export class DialogSettingsComponent implements OnInit {
  supportedLanguages = [ 'gb' , 'it' ]; // Aggiungi le lingue supportate
  selectedLanguage = 'it'; // Lingua predefinita
  tablePreset = new MatTableDataSource<string>();
  displayedColumns = [
    //'id',
    'name' ,
    //'rete',
    //'stazioni',
    //'parametri',
    'azioni'
  ]
  form!: FormGroup;
  selectPreset: Array<any> = [];
  private _deleteArray: Array<string> = [];
  validazioneLayout: any

  constructor(
    private _languageService: LanguageService ,
    private dialogRef: MatDialogRef<DialogParametersComponent> ,
    private settingService: SettingsService ,

    private _layoutService: ThemeLayoutService ,
    private _themeColorService: ThemeColorService ,
    private _themeFontService: ThemeFontService ,
    private fb: FormBuilder ,
    private readonly matDialogService: MatDialog ,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group( {
      languageRadioControl: new FormControl( [ '' ] ) ,
      themeRadioControl: new FormControl( [ '' ] ) ,
      layoutRadioControl: new FormControl( [ '' ] ) ,
      fontRadioControl: new FormControl( [ '' ] ) ,
    } )

    this.getConfigs();

  }


  close() {
    if ( this._deleteArray.length > 0 ) {
      let dialog = this.matDialogService.open( DialogInfoComponent , {
        data: {
          title: 'Attenzione' ,
          message: 'Ci sono preset da eliminare, vuoi continuare?' ,
          role: 'alert' ,
          actionButton: 'Elimina e chiudi' ,
        }
      } )

      dialog.afterClosed()
        .pipe(
          switchMap<string , Observable<string>>( res => {
              return iif( () => !!res ,
                this._deleteAllElementToArray().pipe(
                  mergeMap( ( response ) => of( res ) )
                ) ,
                of( res )
              )
            }
          ),
          finalize( () => this.dialogRef.close())
        )
        .subscribe( res => {
          if ( !!this._deleteArray.length ) {
            this._deleteArray = [];
          }
        } );
    } else {
      this.dialogRef.close();
    }
  }

  getConfigs() {
    let layout$ = this._layoutService.validazioneLayout$;
    let configList$ = this.settingService.getConfigList();
    let currentLanguage$ = this._languageService.currentLanguage$;
    let themeColor$ = this._themeColorService.currentColor$;
    let themeFont$ = this._themeFontService.currentFont$;
    combineLatest( [ layout$ , configList$ , currentLanguage$ , themeColor$ , themeFont$ ] )
      .pipe(
        take( 1 )
      )
      .subscribe( ( [ layout , lista , language , themeColor , themeFont ] ) => {
        this.tablePreset.data = lista;
        this.form.get( 'layoutRadioControl' )?.setValue( layout?.set );
        this.form.get( 'languageRadioControl' )?.setValue( language );
        this.form.get( 'themeRadioControl' )?.setValue( themeColor );
        this.form.get( 'fontRadioControl' )?.setValue( themeFont );
      } );
  }

  onSubmit() {
    this._resetAllConfigService();
    this._deleteAllElementToArray()
      .subscribe( res => {
        console.info( res );
        // resetto l'array di elementi da eliminare
        this._deleteArray = [];
        this.close();
      } );
    this.dialogRef.close();
  }

  /**
   * @description Elimina tutti gli elementi presenti nell'array e poi chiude la modal
   */
  private _deleteAllElementToArray() {
    // prima di chiudere la modal devo eliminare i preset che sono stati eliminati
    let listObservable$ = this._deleteArray.map( element => this.settingService.deleteConfig( element ) );
    return forkJoin( [ ...listObservable$ ] )
  }

  /**
   * @description Resetta tutti i servizi che hanno a che fare con la configurazione
   * @returns void
   *
   */
  private _resetAllConfigService() {
    this._layoutService.setValidazioneLayout( this.form.value.layoutRadioControl );
    this._languageService.setLanguage( this.form.value.languageRadioControl );
    this._themeColorService.setThemeColor( this.form.value.themeRadioControl );
    this._themeFontService.setThemeFont( this.form.value.fontRadioControl );
  }

  deleteConfig( element: string ) {
    // Elimina l'element dalla lista
    this.tablePreset.data = this.tablePreset.data.filter( ( value , index , arr ) => {
      if ( value != element ) {
        // mando il value nel array da eliminare
        return true;
      }
      this._deleteArray.push( value );
      return false;
    } );
  }

}
