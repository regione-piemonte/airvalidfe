/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component , OnInit } from '@angular/core';
import { MatDialog , MatDialogConfig } from '@angular/material/dialog';
import { BehaviorSubject , concatMap , finalize , forkJoin , from , map , Observable , Subject, switchMap , toArray , } from 'rxjs';
import { DatasService } from 'src/app/core/services/api/datas/datas.service';
import { NetworksService } from 'src/app/core/services/api/networks/networks.service';
import { DialogInitConfigComponent } from 'src/app/shared/components/dialogs/dialog-init-config/dialog-init-config.component';
import { DialogParametersComponent } from 'src/app/shared/components/dialogs/dialog-parameters/dialog-parameters.component';
import * as moment from 'moment';
import { ColorService } from 'src/app/core/services/utility/color.service';
import { SettingsService } from 'src/app/core/services/api/settings/settings.service';
import { DataService } from 'src/app/core/services/data/data.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ThemeLayoutService } from 'src/app/core/services/utility/theme-layout.service'
import { IParameter } from '../../core/models/dataService';
import { ITimeSelected } from '../../shared/components/validazione-dettaglio/models/time-selected.model';
import { IGrafico } from '../../core/models/grafico';

@Component( {
  selector: 'app-elaborazioni' ,
  templateUrl: './elaborazioni.component.html' ,
  styleUrls: [ './elaborazioni.component.scss' ] ,
} )
export class ElaborazioniComponent implements OnInit {
  parameters$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  dataset$ = new BehaviorSubject<IGrafico[] | null>(null);
  datasetDettaglio$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  visibilityNotValidDataSeries$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  visibilitySeries$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  deleteSeries$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  changeColorSeries$: BehaviorSubject<{name: string; color: string}> = new BehaviorSubject<{name: string; color: string}>({name: '', color: ''});
  changeValueDataOutput$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  responseDataList: Array<Array<any>> = [];
  parameters: Array<any> = [];
  validazioneLayout$: any;

  constructor(
    private networksService: NetworksService ,
    private datasService: DatasService ,
    private dialog: MatDialog ,
    private colorService: ColorService ,
    private settingsService: SettingsService ,
    private dataService: DataService ,
    private spinnerService: NgxSpinnerService ,
    private layoutService: ThemeLayoutService
  ) {
  }

  ngOnInit(): void {
    this.getLayoutConf();
    this.openDialog();


  }

  openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1 ,
      title: 'Selezione parametri' ,
    };

    const dialogRef = this.dialog.open( DialogInitConfigComponent , dialogConfig );
    dialogRef.afterClosed().subscribe( ( data ) => {
      localStorage.setItem( 'lavoro' , data.lavoro );
      this.openDialogPrameters();
    } );
  }


  openDialogPrameters() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1 ,
      title: 'Selezione parametri' ,
    };

    const dialogRef = this.dialog.open( DialogParametersComponent , dialogConfig );
    dialogRef.afterClosed().subscribe( ( data ) => {
      let count = this.parameters.length;
      data.selected.parametri.forEach( ( element: any ) => {
        data.all
          .filter( ( x: any ) => x.name == element.name )
          .forEach( ( elementParams: any ) => {
            this.parameters.push( {
              color: this.colorService.getColor( count++ ) ,
              visible: true ,
              visibleOrigin: false ,
              visibleNotValid: false ,
              locked: false ,
              userLock: '' ,
              stazione: data.selected.stazioni.filter( ( x: any ) =>
                ( elementParams.key as string ).includes( x.key )
              )[ 0 ] ,

              area: data.selected.areeTerritoriali.filter(
                ( x: any ) =>
                  x.key ==
                  elementParams.key.substring( 0 , elementParams.key.indexOf( '.' ) )
              )[ 0 ] ,
              parametro: elementParams ,
            } );
          } );
      } );

      this.parameters$.next( this.parameters );
      this.getParams( this.parameters );
    } );
  }

  getRow( event: Array<number> | number ) {
    if ( typeof event == 'number' ) {
      this.datasetDettaglio$.next( event );
    }
  }

  getLayoutConf() {
    
    this.layoutService.validazioneLayout$.subscribe((value)=> this.validazioneLayout$ = value );
  }

  getVisibility( event: any ) {
    this.visibilitySeries$.next( event );
  }

  getVisibilityNotValid( event: any ) {
    console.log( 'event not valid' , event );
    this.visibilityNotValidDataSeries$.next( event );
  }

  deleteSeries( event: any ) {
    console.log( 'deleteSeries' , event );
    this.deleteSeries$.next( event );
    this.datasetDettaglio$.next( null );
  }

  changeColorSeries( event: {name: string; color: string} ) {
    console.log( 'colorSerier' , event );
    this.changeColorSeries$.next( event );
  }

  changeValueDataOutput(event: any) {
    console.log('value', event);
    this.changeValueDataOutput$.next(event);
  }

  getParams( event: IParameter[] ) {
    this.spinnerService.show( 'global' );
    const arrayParameters: Array<Observable<ITimeSelected[]>> = [];
    event.forEach( ( element ) => {
      arrayParameters.push(
        this.datasService.getSensorData( element.parametro.key , element.parametro.measurementPeriod )
      );
    } );

    this.datasService.getForkJoinSensorData( event , arrayParameters )
        .pipe(
            map( ( values ) => {
              let parametersNotVisible = event.filter( element => !element.visible);
                if ( parametersNotVisible.length > 0 ) {
                    parametersNotVisible.forEach( element => {
                      let indexItem = values.findIndex( item => item.parametro.key == element.parametro.key);
                      values[indexItem].visible = element.visible;
                    });
                }
              return values;
            }),
            finalize(() => this.spinnerService.hide( 'global' ) )
        ).subscribe( {
        next: values => {
          this.responseDataList = [];
          values.forEach( ( element ) => {
            if ( element.parametro.key.includes( '|' ) ) {
              let anno = +moment( +localStorage.getItem( 'startDate' )! )
                .utcOffset( '+0100' )
                .format( 'YYYY' );
              element.dataset = JSON.parse(
                JSON.stringify(
                  element.dataset.map( ( time ) => {
                    return {
                      ...time ,
                      timestamp: moment( time.timestamp ).year( anno ).valueOf() ,
                    };
                  } )
                )
              );
            }
            this.responseDataList.push( element.dataset );
          } );
          this.dataset$.next( values );
        } ,
        error: err => {

        } ,
        complete: () => {}
      } );
  }
}
