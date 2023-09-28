/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component , EventEmitter , Input , OnDestroy , OnInit , Output , ViewChild , } from '@angular/core';
import { MatDialog , MatDialogConfig , MatDialogRef } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatTableDataSource } from '@angular/material/table';
import { filter , forkJoin , iif , map , mergeMap , Observable , of , Subject , Subscription , switchMap , tap , throwError , } from 'rxjs';
import { ColorService } from 'src/app/core/services/utility/color.service';
import { DialogColorPickerComponent } from '../dialogs/dialog-color-picker/dialog-color-picker.component';
import { DialogParametersComponent } from '../dialogs/dialog-parameters/dialog-parameters.component';
import { DataService } from 'src/app/core/services/data/data.service';
import { DialogExportCsvComponent } from '../dialogs/dialog-export-csv/dialog-export-csv.component';
import { ExportCsvService } from 'src/app/core/services/utility/export-csv.service';
import * as moment from 'moment';
import { DialogService } from '../dialogs/services/dialog.service';
import { DatalocksService } from 'src/app/core/services/api/datalocks/datalocks.service';
import { PollingLockService } from './services/polling-lock.service';
import { DialogAnnoSelectComponent } from '../dialogs/dialog-anno-select/dialog-anno-select.component';
import { IParameter , ObservableData } from '../../../core/models/dataService';
import { TranslateService } from '@ngx-translate/core';
import { DatasService } from '../../../core/services/api/datas/datas.service';
import { SensorsService } from '../../../core/services/api/sensors/sensors.service';
import { IConfigDialogParameter , IData , IStatus } from '../../../views/validazione/validazione.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs/operators';
import { IGetStatusLock } from '../../models/interface/BE/response/getLock';

export interface ValoriTabella {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: any[] = [];

@Component( {
  selector: 'app-validazione-parametri' ,
  templateUrl: './validazione-parametri.component.html' ,
  styleUrls: [ './validazione-parametri.component.scss' ] ,
} )
export class ValidazioneParametriComponent implements OnInit, OnDestroy {
  @Input() dataInput?: Observable<IParameter[]>;
  @Output() rowSelected: EventEmitter<number | Array<number>> = new EventEmitter();
  @Output() paramsOutput: EventEmitter<Array<IParameter>> = new EventEmitter();
  @Output() visibilityNotValidDataSeries: EventEmitter<any> = new EventEmitter();
  @Output() visibilitySeries: EventEmitter<any> = new EventEmitter();
  @Output() deleteSeries: EventEmitter<any> = new EventEmitter();
  @Output() changeColorSeries: EventEmitter<{ name: string; color: string }> = new EventEmitter();
  parameters$: Subject<any> = new Subject();
  parameters: Array<IParameter> = [];


  dataSourceMat = new MatTableDataSource<IParameter>();
  displayedColumns: string[] = [
    'Parametro' ,
    //'Area Terr.',
    'Stazione' ,
    'symbol' ,
  ];
  dataSource = ELEMENT_DATA;
  clickedRows = new Set<ValoriTabella>();

  items = [
    { id: 1 , name: 'Item 1' } ,
    { id: 2 , name: 'Item 2' } ,
    { id: 3 , name: 'Item 3' } ,
  ];

  @ViewChild( MatMenuTrigger ) contextMenu?: MatMenuTrigger;

  contextMenuPosition = { x: '0px' , y: '0px' };

  disableExport: boolean = false;

  rowSelectedDx: boolean = false;

  constructor(
    private dialog: MatDialog ,
    private colorService: ColorService ,
    private dataService: DataService ,
    private readonly datasService: DatasService ,
    private readonly sensorService: SensorsService ,
    private csvService: ExportCsvService ,
    private dialogService: DialogService ,
    private dataLockService: DatalocksService ,
    private pollingLockService: PollingLockService ,
    private translate: TranslateService,
    private spinner: NgxSpinnerService ,
  ) {}

  status: any;

  subscription: Subscription = Subscription.EMPTY;
  arrayParameters: Array<any> = [];

  /**
   * @description Metodo che controlla se il parametro è già presente nella lista, nel caso che lo sia lo rimuove
   * @param data IData
   * @returns void
   * @example
   * this._checkParametroToList(data);
   */
  private _checkParametroToList( data: IData | undefined ) {
    data?.all.forEach( ( { key } , index ) => {
      let parameterKeys = this.parameters.map( item => item.parametro.key );
      if ( parameterKeys.includes( key ) ) {
        let parametri = data?.selected.parametri;
        let indexOf = parametri?.map( ( { key: keyP } ) => keyP ).indexOf( key );
        if ( indexOf > -1 ) {
          parametri?.splice( indexOf , 1 );
        }
      }
    } );
  }

  /**
   * @description Metodo che aggiunge il parametro alla lista
   * @param data IData
   * @returns void
   * @example
   * this._addParametroToList(data);
   */
  private _addParametroToList( data: IData | undefined ) {
    this._checkParametroToList( data );
    let count = this.parameters.length;

    let { selected , all } = data!;
    selected.parametri.forEach( ( element, i ) => {
      all.filter( ( { name } ) => name === element.name )
        .forEach( ( elementParams ) => {
          let param = this.dataService.createParameter( count , selected , elementParams, selected?.status?.[i] );
          this.parameters.push( param );
          if (
            selected.areeTerritoriali
              .filter( ( { key } ) => key === elementParams.key.substring( 0 , elementParams.key.indexOf( '.' ) ) )[ 0 ]
              .extraInfo.includes( 'write' )
          ) {
            let anno = moment( +localStorage.getItem( 'startDate' )! )
              .utcOffset( '+0100' )
              .format( 'YYYY' );

            let item:Partial<IGetStatusLock> = {
              measurementId: elementParams.key ,
              year: +anno ,
              userId: undefined ,
              date: undefined ,
              locked: true ,
              myLock: true ,
            };
            this.arrayParameters.push(
              this.dataLockService.setSensorStateLock( elementParams.key , item )
            );
          }
        } );

      this.pollingLockService.setArray( this.arrayParameters );
    } );
  }

  ngOnInit(): void {
    //subscribe reload parameter
    this.dataService.reloadParameterObs$
      .pipe(
        filter( ( data ) => !!Object.keys(data).length ) ,
      )
      .subscribe( ( {index, dataset, parameter} ) => {
      console.log( 'parametro da ricaricare' , {index, dataset, parameter } );
        this.paramsOutput.emit( this.parameters );
        this.parameters[ index! ].visibleNotValid = false;
    } );

    //subscribe show/hide not valid value
    this.dataService.parametersListShowNotValid$.subscribe( ( item ) => {
      console.log( 'Key' , item );
      if ( item ) {
        let index = this.parameters
          .map( ( x: any ) => x.parametro.key )
          .findIndex( ( x: any ) => x == item.parametro.key );

        console.log( 'series index' , this.parameters[ index ] );

        if ( this.parameters.length > 0 && index != undefined ) {
          this.parameters[ index ].visibleNotValid = true;

          this.visibilityNotValidDataSeries.emit( {
            name: item.parametro.name + ' - ' + item.stazione.name ,
            visibilityNotValid: 1 , //this.parameters[index].visibleNotValid?1:0
          } );
        }
      }
    } );

    // Polling per il lock
    this.dataService.isSavedStream$.subscribe( ( res ) => {
      this.disableExport = res;
    } );

    this.dataInput?.pipe(
      filter( ( data ) => !!data.length ) ,
      tap<IParameter[]>( resp => console.info(resp) ),
      switchMap( ( val ) => {
        if ( val.some(item => item.parametro.extraInfo.includes('write') || item.parametro.extraInfo.includes('advanced'))  ){
          return forkJoin(val.map( ( element ) => this.dataLockService.setSensorStateLock( element.parametro.key, {
            measurementId: element.parametro.key ,
            userId: undefined ,
            date: undefined ,
            locked: true ,
            myLock: true ,
          } ))).pipe(
            map( ( res ) => val )
          )
        }
        return of(val);
      }),
      switchMap( ( val ) => {
        return forkJoin(val.map( ( element ) => this.dataLockService.getSensorStateLock( element.parametro.key )
          .pipe(
            map( ( res ) => ({...element,...res}))
          )
        ))
      })
    ).subscribe( ( val ) => {
        console.log( 'Val data input' , val );
        if ( val ) {
          this.parameters = val;
          this.dataSourceMat.data = val;
          this.arrayParameters = [];

          val.forEach( ( element ) => {
            if (
              element.parametro.extraInfo.includes( 'write' ) ||
              element.parametro.extraInfo.includes( 'advanced' )
            ) {
              let item: Partial<IGetStatusLock> = {
                measurementId: element.parametro.key ,
                userId: undefined ,
                date: undefined ,
                locked: true ,
                myLock: true ,
              };
              this.arrayParameters.push(
                this.dataLockService.setSensorStateLock(
                  element.parametro.key ,
                  item
                )
              );
            }
          } );
          this.pollingLockService.setArray( this.arrayParameters );

          if ( this.subscription == Subscription.EMPTY ) {
            this.subscription = this.pollingLockService
              .getAllParameters()
              .subscribe( ( res ) => {
                console.log( 'res polling' , res );
                console.log( 'Datasouce table' , this.dataSourceMat.data );

                res.forEach( ( resElement ) => {
                  let index = this.dataSourceMat.data
                    .map( ( x ) => x.parametro.key )
                    .indexOf( resElement.measurementId );

                  if ( index >= 0 ) {
                    // controllo lock
                    if (
                      this.dataSourceMat.data[ index ].area.extraInfo.length > 1 &&
                      resElement.myLock &&
                      resElement.locked
                    ) {
                      this.dataSourceMat.data[ index ].locked = false;
                    } else if (
                      this.dataSourceMat.data[ index ].area.extraInfo.length > 1 &&
                      !resElement.myLock &&
                      resElement.locked
                    ) {
                      this.dataSourceMat.data[ index ].locked = true;
                      this.dataSourceMat.data[ index ].userLock =
                        resElement.userInfo;
                    } else {
                      this.dataSourceMat.data[ index ].locked = true;
                      this.dataSourceMat.data[ index ].userLock = resElement.userInfo;
                    }
                  }

                  this.dataSourceMat.data = [...this.dataSourceMat.data];
                } );
              } );
          }
        }
      } );

    this.dataService.dataObs$
      .pipe(
        filter( ( data ) => !!data ) ,
      )
      .subscribe( {
        next: data => {
          console.log( 'data output' , data );
          this._addParametroToList( data! );
          this.dataSourceMat.data = this.parameters;
          this.paramsOutput.emit( this.parameters );
        } ,
        error: err => {

        } ,
        complete: () => {}
      } )
  }

  selectedRow( row: number , element: IParameter ) {
    if ( this.dataService.getToSaveValue().size > 0 ) {
      this.openInfoDialog();
    } else {
      // verifico se la tratta e visibile, nel caso che non lo fosse la devo rendere visibile oppure devo evitare che la possa selezionare
      if ( !element.visible ) {
        element.visible = true;
        this.visibilitySeries.emit( element.parametro.name + ' - ' + element.stazione.name );
      }
      // tolgo la selezione a tutti gli elementi
      this.dataSourceMat.data.forEach( ( element , index ) => {
        element.selected = index === row;
      } );

      const elements = document.getElementsByClassName( 'row-parameters' );
      for ( let i = 0 ; i < elements.length ; i++ ) {
        elements[ i ].classList.remove( 'selected' );
      }
      elements[ row ].classList.add( 'selected' );
      this.rowSelected.emit( row );

      let el: ObservableData = {
        parameter: element ,
        index: row ,
      };

      this.dataService.setSelectedParameter( el );
      this.dataService.setTaratura( [] );
    }
  }

  openDialog() {
    const dialogConfig: MatDialogConfig<IConfigDialogParameter> = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1 ,
      title: 'Selezione parametri' ,
    };

    const dialogRef: MatDialogRef<DialogParametersComponent , IData> = this.dialog.open( DialogParametersComponent , dialogConfig );
    dialogRef.afterClosed()
      .pipe(
        switchMap( ( val ) => {
          if ( val?.selected.parametri.some( item => item.extraInfo.includes('write') || item.extraInfo.includes('advanced'))  ){
            return forkJoin(val?.selected.parametri.map( ( element ) => this.dataLockService.setSensorStateLock( element.key, {
              measurementId: element.key ,
              userId: undefined ,
              date: undefined ,
              locked: true ,
              myLock: true ,
            } ))).pipe(
              map( ( res ) => val )
            )
          }
          return of(val);
        }),
        switchMap( ( val ) => {
          return forkJoin(val!.selected.parametri.map( ( element , index) => this.dataLockService.getSensorStateLock( element.key )
            .pipe(
              map( ( res ) => ({statusLock:{...res}, index}))
            )
          ))
            .pipe(
              map<IStatus[],IData>( ( value ) =>  ({...val!, selected: {...val!.selected, status:[...value]}}) )
            )
        })
      )
      .subscribe( ( data ) => {
      console.log( 'data output' , data );
      this._addParametroToList( data );
      this.dataSourceMat.data = this.parameters;
      this.paramsOutput.emit( this.parameters );
    } );
  }

  openInfoDialog() {
    this.dialogService.openInfoDialog(
      'Attenzione' ,
      'Sono presenti dati modificati. <br/>Procedere con il salvataggio o ripristinare il dataset'
    );
  }

  openDialogExport() {
    const dialogConfig: MatDialogConfig<IConfigDialogParameter> = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1 ,
      title: 'Esportazione Parametri' ,
    };

    const dialogRef: MatDialogRef<DialogExportCsvComponent> = this.dialog.open( DialogExportCsvComponent , dialogConfig );
    dialogRef.afterClosed().subscribe( ( data ) => {
      if ( data ) {
        console.log( 'data export' , data );
        console.log( 'DATI CVSSSSS' , this.dataService.getDataset() );
        this.saveAsCSV( data );
      }
    } );
  }

  openDialogAnno( item: any ) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1 ,
      title: 'Esportazione Parametri' ,
    };

    const dialogRef = this.dialog.open( DialogAnnoSelectComponent , dialogConfig );
    dialogRef.afterClosed().subscribe( ( data ) => {
      if ( data ) {
        console.log( 'data export' , data );
        this.loadConfronto( item , data.anno );
      }
    } );
  }

  saveAsCSV( settings: any ) {
    const items: any[] = [];
    console.log( 'Data filtered csv' , this.dataService.getDatasetFiltered() );
    let notExported = true;
    this.dataService.getDatasetFiltered().forEach( ( element: any ) => {
      if ( element.visible && !element.parametro.key.includes( '|' ) ) {
        element.dataset.forEach( ( elementDataSet: any ) => {
          if ( settings.type == 'Basic' ) {
            let csvLine: any = {
              nome_stazione:
                element.name.split( '-' )[ 1 ] + '-' + element.name.split( '-' )[ 2 ] ,
              nome_parametro: element.name.split( '-' )[ 0 ] ,
              timestamp: moment
                .tz( elementDataSet.timestamp , 'Europe/Berlin' )
                .utcOffset( '+0100' )
                .format( settings.dataFormat ) ,
              valore_originale: elementDataSet.valore_originale
                ? settings.numberSeparator == '.'
                  ? elementDataSet.valore_originale
                  : elementDataSet.valore_originale.toString().replace( '.' , ',' )
                : elementDataSet.valore_originale ,
              valore_validato: elementDataSet.valore_validato
                ? settings.numberSeparator == '.'
                  ? elementDataSet.valore_validato
                  : elementDataSet.valore_validato.toString().replace( '.' , ',' )
                : elementDataSet.valore_validato ,
              validity_flag: elementDataSet.validity_flag ,
              verification_flag: elementDataSet.verification_flag ,
              /*da_rivedere: elementDataSet.da_rivedere,
            data_agg: moment.tz(elementDataSet.data_agg,'Europe/Berlin').utcOffset('+0100').format(settings.dataFormat),
            flag_validaz_autom: elementDataSet.flag_validaz_autom,
            id_aggregazione: elementDataSet.id_aggregazione,
            tipologia_validaz: elementDataSet.tipologia_validaz,*/
            };

            items.push( csvLine );
          } else {
            let csvLine: any = {
              nome_stazione:
                element.name.split( '-' )[ 1 ] + '-' + element.name.split( '-' )[ 2 ] ,
              nome_parametro: element.name.split( '-' )[ 0 ] ,
              timestamp: moment
                .tz( elementDataSet.timestamp , 'Europe/Berlin' )
                .utcOffset( '+0100' )
                .format( settings.dataFormat ) ,
              valore_originale: elementDataSet.valore_originale
                ? settings.numberSeparator == '.'
                  ? elementDataSet.valore_originale
                  : elementDataSet.valore_originale.toString().replace( '.' , ',' )
                : elementDataSet.valore_originale ,
              valore_validato: elementDataSet.valore_validato
                ? settings.numberSeparator == '.'
                  ? elementDataSet.valore_validato
                  : elementDataSet.valore_validato.toString().replace( '.' , ',' )
                : elementDataSet.valore_validato ,
              tipologia_validaz: elementDataSet.tipologia_validaz ,
              flag_validaz_autom: elementDataSet.flag_validaz_autom ,
              validity_flag: elementDataSet.validity_flag ,
              verification_flag: elementDataSet.verification_flag ,
              da_rivedere: elementDataSet.da_rivedere ,
              data_agg: moment
                .tz( elementDataSet.data_agg , 'Europe/Berlin' )
                .utcOffset( '+0100' )
                .format( settings.dataFormat ) ,
              /*da_rivedere: elementDataSet.da_rivedere,
            data_agg: moment.tz(elementDataSet.data_agg,'Europe/Berlin').utcOffset('+0100').format(settings.dataFormat),
            flag_validaz_autom: elementDataSet.flag_validaz_autom,
            id_aggregazione: elementDataSet.id_aggregazione,
            tipologia_validaz: elementDataSet.tipologia_validaz,*/
            };

            items.push( csvLine );
          }
        } );
        notExported = false;
      }
    } );

    if ( notExported ) {
      this.dialogService.openInfoDialog(
        'Attenzione' ,
        'Non ci sono parametri visibili da esportare'
      );
    }

    this.csvService.exportToCsv(
      'AriaWeb_export_' + moment().format( 'DD_MM_YYYY_HH_mm_ss' ) + '.csv' ,
      items ,
      settings.dataSeparator
    );
  }

  clickVisibilityButton( element: IParameter , index: number ) {
    if ( this.dataService.getToSaveValue().size > 0 ) {
      this.openInfoDialog();
    } else {
      // cambio il valore del parametro visibile
      element.visible = !element.visible;
      // emetto l'evento per dire che riga è stata selezionata
      this.rowSelected.emit( index );
      // imposto il parametro selezionato
      let el: ObservableData = {
        parameter: element ,
        index: index ,
      };
      // imposto il parametro selezionato
      // this.dataService.setSelectedParameter( el );
      // emetto l'evento per dire che la visibilità è cambiata
      this.visibilitySeries.emit( element.parametro.name + ' - ' + element.stazione.name );
    }
  }

  // serve per disabilitare il tasto dx per le righe non selezionate
  selectRow(row: any) {
    this.rowSelectedDx = row;
  }

  onContextMenu( event: MouseEvent , item: any ) {
    if (this.rowSelectedDx == item) {
      event.preventDefault();
      this.contextMenuPosition.x = event.clientX + 'px';
      this.contextMenuPosition.y = event.clientY + 'px';
      if ( this.contextMenu ) {
        this.contextMenu.menuData = { item: item };
      }

      this.contextMenu?.menu.focusFirstItem( 'mouse' );
      this.contextMenu?.openMenu();
    }
  }

  onContextMenuAction( item: IParameter , action: string ) {
    switch (action) {
      case 'confronta':
        this.openDialogAnno( item );
        break;
      case 'delete':
        this.dialogService
          .openInfoDialog(
            'Attenzione' ,
            "Procedere con l'eliminazione?" ,
            'Elimina'
          )
          .pipe(
            switchMap( ( res ) => {
              if ( res ) {
                let index = this.parameters.map( ( x: any ) => x.parametro.key ).findIndex( ( x: any ) => x == item.parametro.key );
                return this.dataLockService.deleteSensorStateLock(
                  item.parametro.key ,
                  moment( +localStorage.getItem( 'startDate' )! )
                    .utcOffset( '+0100' )
                    .format( 'YYYY' )
                ).pipe(
                  map( () => true )
                );
              } else {
                return of( false );
              }
            }
          ))
          .subscribe( ( res ) => {
            if ( res ) {
              let index = this.parameters
                .map( ( x: any ) => x.parametro.key )
                .findIndex( ( x: any ) => x == item.parametro.key );

              this.parameters.splice( index , 1 );
              this.arrayParameters.splice( index , 1 );

              this.pollingLockService.setArray( this.arrayParameters );

              this.dataSourceMat.data = this.parameters;
              this.deleteSeries.next(
                item.parametro.name + ' - ' + item.stazione.name
              );
              this.rowSelected.emit( [] );
            }
          } );

        break;
      case 'showOriginData':
        let indexOrigin = this.parameters
          .map( ( x: any ) => x.parametro.key )
          .findIndex( ( x: any ) => x == item.parametro.key );

        this.parameters[ indexOrigin ].visibleOrigin =
          !this.parameters[ indexOrigin ].visibleOrigin;
        this.visibilitySeries.emit(
          item.parametro.name + ' - ' + item.stazione.name + ' - origin'
        );

        break;
      case 'color-picker':
        this.openColorPickerDialog( item );
        break;

      case 'showNotValidData':
        console.log( 'Mostra nascondi dati non validi' );

        let index = this.parameters
          .map( ( x: any ) => x.parametro.key )
          .findIndex( ( x: any ) => x == item.parametro.key );

        console.log( 'series index' , this.parameters[ index ] );

        this.parameters[ index ].visibleNotValid =
          !this.parameters[ index ].visibleNotValid;

        this.visibilityNotValidDataSeries.emit( {
          name: item.parametro.name + ' - ' + item.stazione.name ,
          visibilityNotValid: this.parameters[ index ].visibleNotValid ? 1: 0 ,
        } );
        break;
      case 'parametri-correlati':
        this.sensorService.getSensoriCorrelati( item.parametro.key )
          .pipe(
            mergeMap( lista => {
              if ( lista.length === 0 ) {
                return throwError( () => ( { message: 'Non sono presenti parametri correlati' } ) );
              }
              return of( lista )
            } )
            // switchMap( ( lista ) =>  forkJoin(lista.map(({sensorName}) => this.datasService.getSensorData(sensorName.key, sensorName.measurementPeriod))) ) ,
          )
          .subscribe( {
            next: res => {
              console.log( 'Parametri correlati' , res );

              let {
                sensorNamesList ,
                sensorNames ,
                stationNames ,
                networkNames
              } = this.dataService.createData( res );

              let data: IData = {
                selected: {
                  areeTerritoriali: networkNames ,
                  stazioni: stationNames ,
                  parametri: sensorNamesList
                } ,
                all: sensorNames
              }

              this.dataService.setData( data );

              // this.dialogService.openInfoDialog('Parametri correlati', res);
            } ,
            error: err => {
              console.log( err );
              this.dialogService.openInfoDialog( 'Parametri correlati' , err.message );
            } ,
            complete: () => {}
          } );
        break;
      case 'taratura':
        if ( item?.selected ) {
          this.spinner.show('global');
          let data = this.dataService.getParametersList()?.dataset!;
          this.datasService.getCalibrations( item.parametro.key, data[0].timestamp, data[data.length - 1].timestamp )
            .pipe(
              finalize( () => this.spinner.hide( 'global' ))
            )
                .subscribe( {
                  next: calibrazione => {
                    console.info( calibrazione );
                    this.dataService.setTaratura( calibrazione );
                  } ,
                  error: err => {
                    this.dataService.setTaratura( [] );
                    this.dialogService.openInfoDialog( 'Taratura' , err.message );
                  } ,
                  complete: () => {
                  }
                } ) ;
        }
        if ( !item?.selected ) {
          this.dialogService.openInfoDialog( 'Taratura' , 'Selezionare un parametro' );
        }
        break;
      default:
        break;
    }
  }

  loadConfronto( item: any , anno: number ) {
    console.log( 'Avvio confronto nel tempo' );
    console.log( 'parameters' , this.parameters );

    const index = this.parameters
      .map( ( x ) => x.parametro.key )
      .indexOf( item.parametro.key );
    console.log( 'ìindex' , index );
    const elemento = JSON.parse( JSON.stringify( this.parameters[ index ] ) );
    elemento.parametro.name += '-' + anno;
    elemento.parametro.key += '|' + anno;
    elemento.locked = true;
    elemento.parametro.extraInfo = '';

    this.parameters.push( elemento );
    this.dataSourceMat.data = this.parameters;
    this.paramsOutput.emit( this.parameters );
  }

  tooltipInfoText( element: any ) {
    let textTooltip = '';
    textTooltip += element.visibleOrigin
      ? `${ this.translate.instant( 'button.tooltip.show_data' ) }`
      : `${ this.translate.instant( 'button.tooltip.not_show_data' ) }`;
    textTooltip += '\n';
    textTooltip += element.visibleNotValid
      ? `${ this.translate.instant( 'button.tooltip.valid_data' ) }`
      : `${ this.translate.instant( 'button.tooltip.not_valid_data' ) }`;
    return textTooltip;
  }

  openColorPickerDialog( item: any ) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 2 ,
      title: 'Selezione Colori' ,
    };

    const dialogRef = this.dialog.open(
      DialogColorPickerComponent ,
      dialogConfig
    );

    dialogRef.afterClosed().subscribe( ( data: string ) => {
      if ( data ) {
        let index = this.parameters.findIndex( ( { parametro } ) => parametro.key === item.parametro.key );
        this.parameters[ index ].color = data;
        this.dataSourceMat.data = this.parameters;
        let configColor = {
          name: item.parametro.name + ' - ' + item.stazione.name ,
          color: data ,
        };
        this.changeColorSeries.emit( configColor );
      }
    } );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
