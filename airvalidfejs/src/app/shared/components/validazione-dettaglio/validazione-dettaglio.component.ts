/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit , ChangeDetectionStrategy , ChangeDetectorRef , Component , EventEmitter , Input , OnInit , Output , ViewChild , } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { delay , Observable , switchMap , timer } from 'rxjs';
import { DatalocksService } from 'src/app/core/services/api/datalocks/datalocks.service';
import { DatasService } from 'src/app/core/services/api/datas/datas.service';
import { DataService } from 'src/app/core/services/data/data.service';
import { DialogService } from '../dialogs/services/dialog.service';
import { MatPaginator , MatPaginatorIntl } from '@angular/material/paginator';
import { DialogLinearCorrectionComponent } from '../dialogs/dialog-linear-correction/dialog-linear-correction.component';
import { MatDialog , MatDialogConfig } from '@angular/material/dialog';
import { LanguageService } from 'src/app/core/services/locale/language.service';
import { TranslateService } from '@ngx-translate/core'
import { Dataset , IOutput } from '../../../core/models/grafico';
import { ITimeSelected } from './models/time-selected.model';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize , tap } from 'rxjs/operators';
import { MatSelectChange } from '@angular/material/select';
import { IParameter } from '../../../core/models/dataService';

export interface ValoriTabella {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: ValoriTabella[] = [];

export interface IValueDataOutput {
  indice: number;
  value: ITimeSelected;
  input: Partial<IOutput>;
}

@Component( {
  selector: 'app-validazione-dettaglio' ,
  templateUrl: './validazione-dettaglio.component.html' ,
  styleUrls: [ './validazione-dettaglio.component.scss' ] ,
  changeDetection: ChangeDetectionStrategy.OnPush ,
} )
export class ValidazioneDettaglioComponent implements OnInit, AfterViewInit {
  dataSourceMat = new MatTableDataSource<Dataset>();
  dataSourceMat2 = new MatTableDataSource<Dataset>();
  displayedColumns: string[] = [
    'select' ,
    'giorno' ,
    'ora' ,
    'originale' ,
    'validato' ,
    'codice' ,
    'flag' ,
    'validity_flag' ,
    'validity_flag_state' ,
    'verification_flag' ,
  ];

  disableValidaTutto: boolean = false;

  pageEvent: any;

  listaValidityFlag: any[] = [ 1 , 2 , 3 , -99 , -1 ];
  dataSource = ELEMENT_DATA;
  validityStateTooltipValue = '';
  titleModalonKeyUpEvent = '';
  bodyModalonKeyUpEvent = '';
  clickedRows = new Set<ValoriTabella>();
  selection = new SelectionModel<ITimeSelected>( true , [] );

  @ViewChild( MatMenuTrigger ) contextMenu?: MatMenuTrigger;
  contextMenuPosition = { x: '0px' , y: '0px' };

  parametro: string = '';
  stazione: string = '';
  unitaMisura: any = '';
  area: any;
  input!: Partial<IOutput>;
  page: number = 0;
  fullArrayDataset: Array<any> = [];
  originalArrayDataset: Array<any> = [];
  decimalToggle = false;
  /*
  @ViewChild(MatPaginator) topPaginator:any= MatPaginator;
  @ViewChild(MatPaginator) bottomPaginator:any= MatPaginator;
*/
  @ViewChild( 'paginatorTop' ) topPaginator!: MatPaginator;
  @ViewChild( 'paginatorBottom' ) bottomPaginator!:MatPaginator;

  @Input() dataInput?: Observable<number>;
  @Output() valueDataOutput: EventEmitter<IValueDataOutput> = new EventEmitter();

  isRelativeScale: boolean = false

  constructor(
    public dataService: DataService ,
    private datasServiceApi: DatasService ,
    private dataLockService: DatalocksService ,
    private snackBar: MatSnackBar ,
    private dialogService: DialogService ,
    private changeDetectorRef: ChangeDetectorRef ,
    private dialog: MatDialog ,
    private translateService: TranslateService ,
    private languageService: LanguageService ,
    private matPaginatorIntl: MatPaginatorIntl ,
    private readonly spinnerService: NgxSpinnerService ,
  ) {}

  ngAfterViewInit() {
    this.dataSourceMat2.paginator = this.bottomPaginator;
    this.dataSourceMat.paginator = this.topPaginator;

    //this.topPaginator.length = this.dataSourceMat.data.length;
    //this.bottomPaginator.length = this.dataSourceMat2.data.length;
  }

  ngOnInit(): void {

    // sottoscrizione al cambio scala
    this.dataService.scaleTypeObs$.subscribe( ( val ) => {
      console.log( "Valore scala" , val )
      this.isRelativeScale = !!( val && val == 'relativa' )
    } )


    this.dataService.parametersList$.subscribe( ( val ) => {
      if ( val.parameter ) {

        val.dataset = val.dataset?.map( ( data ) => {
          return {
            ...data ,
            changed: false ,
          };
        } )

        if ( val.parameter?.parametro?.key.includes( '|' ) ) {
          const anno = +val.parameter.parametro.key.substring(
            val.parameter.parametro.key.indexOf( '|' ) + 1 ,
            val.parameter.parametro.key.length
          );


          val.dataset = JSON.parse(
            JSON.stringify(
              val.dataset?.map( ( x: any ) => {
                return {
                  ...x ,
                  changed: false ,
                  timestamp: moment( x.timestamp ).year( anno ).valueOf() ,
                };
              } )
            )
          );
        }

        this.dataSourceMat.data = [ ...val.dataset! ]; // arrayClone.slice(0, 24)
        this.dataSourceMat2.data = [ ...val.dataset! ]; // arrayClone.slice(0, 24)

        this.parametro = val.parameter.parametro ? val.parameter.parametro.name: '';
        this.stazione = val.parameter.stazione ? val.parameter.stazione.name: '';
        this.input = val;

        this.unitaMisura = this.dataService.getUnitMeasure( +val.parameter?.parametro?.measureUnitId! );
        this.disableValidaTutto = val.dataset![ val.dataset!.length - 1 ]?.timestamp >= moment().valueOf();
      } else {
        this.fullArrayDataset = [];
        let arrayClone = JSON.parse( JSON.stringify( this.fullArrayDataset ) );
        this.originalArrayDataset = JSON.parse( JSON.stringify( this.fullArrayDataset ) );
        this.dataSourceMat.data = [];
      }
      this.deleteAllSelection();
    } );

    this.dataInput?.subscribe( ( val ) => {

      let { index , dataset , parameter } = this.dataService.getParametersList() ?? { index: -1 , dataset: [] , parameter: undefined };

      if ( index === val ) {
        let visible = parameter?.visible;
        let parametro = parameter?.parametro?.name ?? '';
        let stazione = parameter?.stazione?.name ?? '';
        this.parametro = visible ? parametro: '';
        this.stazione = visible ? stazione: '';
        this.input = visible ? { dataset , parameter }: {};

        this.dataSourceMat.data = visible ? dataset: [];
        this.dataSourceMat2.data = visible ? dataset: [];
      } else {
        this.deleteAllSelection()
        // this.dataSourceMat.data = []
        // this.dataSourceMat2.data = []
        // this.parametro = '';
        // this.stazione = '';
        // this.unitaMisura = '';
      }
    } );

    // subscribe traduzione
    this.languageService.currentLanguage$.subscribe( ( language: string ) => {
      this.translateService.getTranslation( language ).subscribe( ( res: any ) => {
        this.titleModalonKeyUpEvent = res.dialog_data_not_valid.title;
        this.bodyModalonKeyUpEvent = res.dialog_data_not_valid.body;
        this.matPaginatorIntl.itemsPerPageLabel = res.table.pagination.per_page;
        this.matPaginatorIntl.nextPageLabel = res.table.pagination.next_page;
        this.matPaginatorIntl.previousPageLabel = res.table.pagination.previous_page;
        this.matPaginatorIntl.firstPageLabel = res.table.pagination.first_page;
        this.matPaginatorIntl.lastPageLabel = res.table.pagination.last_page;
        this.matPaginatorIntl.changes.next();
      } );
    } );
  }

  openInfoDialog(
    title: string ,
    message: string ,
    actionTitle?: string ,
    type?: string
  ) {
    this.dialogService.openInfoDialog( title , message , actionTitle , type );
  }

  onKeyUpEvent( event: any , element: any , indice: any ) {
    console.log( 'event' , event.target.value );
    console.log( 'element Dettaglio' , element );
    console.log( 'indice' , indice );

    if ( event.target.value.toString().indexOf( '-' ) == 0 && event.target.value.toString().length < 2 ) {
      return
    }

    if (
      !event.target.value.match( '^-?(\\d{1,})(,\\d{1,3})*(\\.\\d{1,})?$' ) &&
      event.target.value.toString().indexOf( '.' ) !=
      event.target.value.toString().length - 1
    ) {
      this.openInfoDialog( this.titleModalonKeyUpEvent , this.bodyModalonKeyUpEvent , undefined , 'error' );
      return;
    }

    element.valore_validato = +event.target.value;
    let el = {
      indice: element.timestamp ,
      value: element , //event.target.value,
      input: this.input ,
    };

    element.changed = true
    /*const row = event.target.closest('tr');
    if (row) {
      const condition = element.valore_validato != element.valore_originale;
      row.classList.toggle('change-value', condition);
    }*/

    let index = this.fullArrayDataset
      .map( ( x ) => x.timestamp )
      .indexOf( element.timestamp );
    console.log( 'index' , index );
    this.fullArrayDataset[ index ] = element;

    this.valueDataOutput.emit( el );
  }

  selectedValidity( event: MatSelectChange , element: ITimeSelected ) {
    console.log( 'Selected' , event );
    console.log( 'Element' , element );

    if ( +element.verification_flag == 3 ) {
      element.verification_flag = 2;
    }

    element.changed = true

    let el = {
      indice: element.timestamp ,
      value: element , //event.target.value,
      input: this.input ,
    };
    if ( event.value < 0 ) {
      this.dataService.setShowNotValidList( this.input?.parameter as IParameter );
    }

    let index = this.fullArrayDataset
      .map( ( x ) => x.timestamp )
      .indexOf( element.timestamp );
    console.log( 'index' , index );
    this.fullArrayDataset[ index ] = element;

    this.validityStateTooltip( element.verification_flag );
    this.valueDataOutput.emit( el );
  }

  validaTutto() {
    console.log( 'input' , this.input );

    this.input?.dataset!.forEach( ( { verification_flag , tipologia_validaz , timestamp , ...item }: ITimeSelected ) => {
      if ( verification_flag === 3 && tipologia_validaz != 'FFF' ) {
        verification_flag = 2;
        let value: ITimeSelected = {...item, timestamp, tipologia_validaz, verification_flag};
        //validity_flag = 1;
        let el: IValueDataOutput = {
          indice: timestamp ,
          value , //event.target.value,
          input: this.input ,
        };
        let itemIndex = this.dataSourceMat.data.findIndex( ( { timestamp } ) => timestamp === value.timestamp );
        if ( itemIndex > -1 ) {
          this.dataSourceMat.data[ itemIndex ] = {...value, changed: true};
          this.dataSourceMat.data = [ ...this.dataSourceMat.data ];
        }
        this.valueDataOutput.emit( el );
      }
    } );
  }

  roundNumber(number: number, decimalPlaces: number): number {
    const multiplier = Math.pow(10, decimalPlaces);
    return Math.round(number * multiplier) / multiplier;
  }

  certificaTutto() {
    console.log( 'input' , this.input );

    this.input?.dataset!.forEach( ( element: any , index: number ) => {
      if (
        element.verification_flag == 2 &&
        element.tipologia_validaz != 'FFF'
      ) {
        //if (element.verification_flag == 2){//} || element.verification_flag == 3) {
        element.verification_flag = 1;
        //  element.validity_flag = 1;
        let el = {
          indice: element.timestamp ,
          value: element , //event.target.value,
          input: this.input ,
        };
        this.input.dataset![ index ].verification_flag = 1;
        this.valueDataOutput.emit( el );
      }
    } );

    this.fullArrayDataset = JSON.parse( JSON.stringify( this.input.dataset ) );
    let arrayClone = JSON.parse( JSON.stringify( this.fullArrayDataset ) );
    this.originalArrayDataset = JSON.parse(
      JSON.stringify( this.fullArrayDataset )
    );
    //this.dataSourceMat.data = arrayClone.slice(0, 24)
    //this.page=0

    /*setTimeout(() => {
      this.paginator.pageIndex = 0;
      this.paginator.length = this.fullArrayDataset.length
    });*/
  }

  decertificaTutto() {
    console.log( 'input' , this.input );

    this.input.dataset!.forEach( ( element: any , index: number ) => {
      if (
        element.verification_flag == 1 &&
        element.tipologia_validaz != 'FFF'
      ) {
        // if (element.verification_flag == 1 ) {
        element.verification_flag = 2;
        // element.validity_flag = -1;
        let el = {
          indice: element.timestamp ,
          value: element , //event.target.value,
          input: this.input ,
        };
        this.input.dataset![ index ].verification_flag = 2;
        this.valueDataOutput.emit( el );
      }
    } );
    console.log( 'Decertifica tutto' , this.input );
    //this.dataSourceMat.data = this.input.dataset;

    this.fullArrayDataset = JSON.parse( JSON.stringify( this.input.dataset ) );
    let arrayClone = JSON.parse( JSON.stringify( this.fullArrayDataset ) );
    this.originalArrayDataset = JSON.parse(
      JSON.stringify( this.fullArrayDataset )
    );
    //this.dataSourceMat.data = arrayClone.slice(0, 24)
    this.page = 0;

    setTimeout( () => {
      this.topPaginator.pageIndex = 0;
      this.topPaginator.length = this.fullArrayDataset.length;
    } );
  }

  invalidaTutto() {
    console.log( 'input' , this.input );
    console.log( 'dataset' , this.fullArrayDataset );
    this.input.dataset!.forEach( ( element: any ) => {
      if ( element.verification_flag == 2 || element.verification_flag == 3 ) {
        element.verification_flag = 2;
        element.validity_flag = -1;
        let el = {
          indice: element.timestamp ,
          value: element , //event.target.value,
          input: this.input ,
        };

        /* let index=this.fullArrayDataset.map(x=>x.timestamp).indexOf(element.timestamp)
        console.log("index",index)
    this.fullArrayDataset[index]=element*/

        this.valueDataOutput.emit( el );
      }
    } );

    this.fullArrayDataset = JSON.parse( JSON.stringify( this.input.dataset ) );
    let arrayClone = JSON.parse( JSON.stringify( this.fullArrayDataset ) );
    this.originalArrayDataset = JSON.parse(
      JSON.stringify( this.fullArrayDataset )
    );
    //this.dataSourceMat.data = arrayClone.slice(0, 24)
    this.page = 0;

    setTimeout( () => {
      this.topPaginator.pageIndex = 0;
      this.topPaginator.length = this.fullArrayDataset.length;
    } );
  }

  saveData() {
    this.spinnerService.show( 'global' );
    if ( this.dataService.getToSaveValue().size > 0 ) {
      let array: Array<ITimeSelected> = [];

      for ( let key of this.dataService.getKeysToSaveValue() ) {
        let newVar = this.dataService.getToSaveValueByKey( key );
        if ( newVar ) {
          for ( let subKey of newVar!.keys() ) {
            let indexSerie = this.dataService.getIndexParameterList( key );
            let indexDataset = this.dataService.getDataSetByIndex( indexSerie ).dataset.map( ( { timestamp } ) => timestamp ).indexOf( newVar?.get( subKey )?.timestamp! );

            this.dataService.getDataSetByIndex( indexSerie ).dataset[ indexDataset ] = {
              ...this.dataService.getDataSetByIndex( indexSerie ).dataset[ indexDataset ] ,
              ...newVar?.get( subKey ) ,
              changed: newVar.get( subKey )?.changed! ,
            }

            this.dataService.setDataset( this.dataService.getDataset() );
            array.push( newVar?.get( subKey )! );
          }

          this.datasServiceApi.setSensorData( key , array )
            .pipe(
              finalize( () => this.spinnerService.hide( 'global' ) )
            )
            .subscribe( {
              next: res => {
                if ( res ) {
                  this.dataService.clearSaveValue();
                  this.deleteAllSelection();
                  this.dialogService.openInfoDialog(
                    'Attenzione' ,
                    'Salvataggio avvenuto con successo' ,
                    undefined ,
                    'success'
                  );
                }
              } ,
              error: err => {
                this.dialogService.openInfoDialog(
                  'Attenzione' ,
                  'Salvataggio non avvenuto' ,
                  undefined ,
                  'error'
                );
              } ,
              complete: () => {}
            } );
        }
      }

      /* this.datasServiceApi.setSensorData().subscribe(res=>{

      })*/
    } else {
      console.log( 'Dati vuoti. Nessun dato da salvare' );
      this.deleteAllSelection();
      this.spinnerService.hide( 'global' );
    }
  }

  onContextMenu( event: MouseEvent , item: any ) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    if ( this.contextMenu ) {
      this.contextMenu.menuData = { item: item };
    }

    this.contextMenu?.menu.focusFirstItem( 'mouse' );
    this.contextMenu?.openMenu();
  }

  onContextMenuAction( item: any , action: string ) {

    switch (action) {
      case 'correzione lineare':
        console.log( 'selezionate' , this.selection.selected );
        this.openLinearCorrectionDialog();
        break;
      case 'valida':
        console.log( 'selezionate' , this.selection.selected );

        this.selection.selected.forEach( ( element ) => {
          if ( ( element.verification_flag == 2 || element.verification_flag == 3 ) && element.tipologia_validaz != 'FFF' ) {
            element = {
              ...element ,
              verification_flag: 2 ,
              validity_flag: 1 ,
              changed: true ,
            }
            let el = {
              indice: element.timestamp ,
              value: element , //event.target.value,
              input: this.input ,
            };


            let index = this.dataSourceMat.data!
              .map( ( x ) => x.timestamp )
              .indexOf( element.timestamp );
            this.dataSourceMat.data![ index ] = element;
            this.dataSourceMat.data = [ ...this.dataSourceMat.data ];

            this.valueDataOutput.emit( el );
          }
        } );
        this.deleteAllSelection();
        break;
      case 'invalida':
        this.selection.selected.forEach( ( element, i, list ) => {
          if (( element.verification_flag == 2 || element.verification_flag == 3 ) && element.tipologia_validaz != 'FFF' ) {
            element = {
              ...element ,
              verification_flag: 2 ,
              validity_flag: -1 ,
              changed: true ,
            }

            let el: IValueDataOutput = {
              indice: element.timestamp ,
              value: element , //event.target.value,
              input: this.input ,
            };

            let index = this.dataSourceMat.data!
              .map( ( x ) => x.timestamp )
              .indexOf( element.timestamp );
            this.dataSourceMat.data![ index ] = element;
            this.dataSourceMat.data = [ ...this.dataSourceMat.data ];
            this.dataService.setShowNotValidList( this.input.parameter as IParameter );
            this.valueDataOutput.emit( el );
          }
        } );
        this.deleteAllSelection();

        break;

      case 'decertifica':
        this.selection.selected.forEach( ( element ) => {
          if ( element.verification_flag == 1 ) {
            element = {
              ...element ,
              verification_flag: 2 ,
              changed: true ,
            };

            let el = {
              indice: element.timestamp ,
              value: element , //event.target.value,
              input: this.input ,
            };


            let index = this.dataSourceMat.data!
              .map( ( x ) => x.timestamp )
              .indexOf( element.timestamp );
            this.dataSourceMat.data![ index ] = element;
            this.dataSourceMat.data = [ ...this.dataSourceMat.data ];

            this.valueDataOutput.emit( el );
          }
        } );
        this.deleteAllSelection();
        break;

      case 'certifica':
        this.selection.selected.forEach( ( element: any ) => {
          if ( element.verification_flag == 2 ) {
            element = {
              ...element ,
              verification_flag: 1 ,
              changed: true ,
            }

            let el = {
              indice: element.timestamp ,
              value: element , //event.target.value,
              input: this.input ,
            };

            let index = this.dataSourceMat.data!
              .map( ( x ) => x.timestamp )
              .indexOf( element.timestamp );
            this.dataSourceMat.data![ index ] = element;
            this.dataSourceMat.data = [ ...this.dataSourceMat.data ];
            this.valueDataOutput.emit( el );
          }
        } );
        this.deleteAllSelection();
        break;
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSourceMat.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSourceMat.data.forEach( ( row ) => this.selection.select( row ) );
  }

  deleteAllSelection() {
    this.selection.clear();
  }

  checkboxLabel( row?: any ): string {
    if ( !row ) {
      return `${ this.isAllSelected() ? 'deselect': 'select' } all`;
    }
    return `${ this.selection.isSelected( row ) ? 'deselect': 'select' } row ${
      row.position + 1
    }`;
  }

  validityStateTooltip( element: number ): string {
    // console.log(element);

    switch (element) {
      case 1:
        return 'Valido';

      case 2:
        return 'Valido ma sotto il limite di rilevabilità (DL)';

      case 3:
        return 'Valido ma sotto il limite di rilevabilità (DL) e rimpiazzato con DL/2';

      case -99:
        return 'Non valido perchè lo strumento è in manutenzione o in calibrazione';

      case -1:
        return 'Non Valido';

      default:
        return element?.toString();
    }
  }

  trackElement( index: number , item: Dataset ): number {
    return item.timestamp;
  }

  onPaginate( event: any ) {
    console.log( 'event' , event );
    /* this.page = event.pageIndex;

    setTimeout(() => {
      this.paginator.pageIndex = this.page;
      this.paginator.length = this.fullArrayDataset.length
    });*/

    let arrayClone = JSON.parse( JSON.stringify( this.fullArrayDataset ) );
    //this.dataSourceMat.data = arrayClone.slice(event.pageIndex * 24, (event.pageIndex * 24) + 24)
  }

  loadOriginalData() {
    if ( !this.input ) {
      this.dialogService.openInfoDialog( 'Attenzione' , 'Nessun dato da caricare' , 'Ok' );
      throw new Error( 'Nessun dato da caricare' );
    }
    this.dialogService
      .openInfoDialog(
        'Attenzione' ,
        'Procedere con il caricamento dei dati?' ,
        'Ricarica'
      )
      .subscribe( ( res ) => {
        if ( res ) {
          console.log( 'load' , this.input );
          console.log( 'loadDataset' , this.dataService.getDataset() );

          this.dataService.clearSaveValue();
          this.deleteAllSelection();

          let indexParameter = this.dataService
            .getDataset()
            .map( ( { parametro } ) => parametro.key )
            .indexOf( this.input.parameter!.parametro!.key );
          this.dataService.getDataset()[ indexParameter ].dataset = JSON.parse( JSON.stringify( this.input.dataset ) );

          this.dataService.setDataset( this.dataService.getDataset() );

          this.fullArrayDataset = JSON.parse(
            JSON.stringify(
              this.dataService.getDataset()[ indexParameter ].dataset
            )
          );
          let arrayClone = JSON.parse( JSON.stringify( this.fullArrayDataset ) );
          this.originalArrayDataset = JSON.parse(
            JSON.stringify( this.fullArrayDataset )
          );
          //this.dataSourceMat.data = arrayClone.slice(0, 24)

          setTimeout( () => {
            this.topPaginator.pageIndex = this.page;
            this.topPaginator.length = this.fullArrayDataset.length;
          } );

          this.dataService.reloadParameter( this.input );
        }
      } );
  }

  setSelection() {
    console.log( 'selection' , this.selection );
    this.selection.select( ...this.dataSourceMat.data.slice( 0 , 10 ) );
  }

  public handlePageTop( e: any ) {
    let { pageSize } = e;

    this.bottomPaginator.pageSize = pageSize;

    if ( !this.topPaginator.hasNextPage() ) {
      this.bottomPaginator.lastPage();
    } else if ( !this.topPaginator.hasPreviousPage() ) {
      this.bottomPaginator.firstPage();
    } else {
      if ( this.topPaginator.pageIndex < this.bottomPaginator.pageIndex ) {
        this.bottomPaginator.previousPage();
      } else if ( this.topPaginator.pageIndex > this.bottomPaginator.pageIndex ) {
        this.bottomPaginator.nextPage();
      }
    }
  }

  public handlePageBottom( e: any ) {
    if ( !this.bottomPaginator.hasNextPage() ) {
      this.topPaginator.lastPage();
    } else if ( !this.bottomPaginator.hasPreviousPage() ) {
      this.topPaginator.firstPage();
    } else {
      if ( this.bottomPaginator.pageIndex < this.topPaginator.pageIndex ) {
        this.topPaginator.previousPage();
      } else if ( this.bottomPaginator.pageIndex > this.topPaginator.pageIndex ) {
        this.topPaginator.nextPage();
      }
    }
  }

  openLinearCorrectionDialog() {
    let dialogConfig = new MatDialogConfig();
    dialogConfig = {
      ...dialogConfig ,
      disableClose: true ,
      autoFocus: true ,
      data: {
        id: 1 ,
        title: 'Selezione parametri' ,
      }
    };
    const dialogRef = this.dialog.open(
      DialogLinearCorrectionComponent ,
      dialogConfig
    );

    dialogRef
      .afterClosed()
      .subscribe( ( data: {slope: number; offset: number} ) => {

        if ( data ) {

          const filteredArray = this.selection.selected
            .filter( ( { tipologia_validaz , verification_flag } ) => tipologia_validaz != 'MMM' && tipologia_validaz != 'FFF' || verification_flag === 2 )

          filteredArray.forEach( ( element, i, list ) => {
            if ( element.verification_flag == 2 ) {
              element = {
                ...element ,
                valore_validato: element.valore_validato * +data.slope + +data.offset,
                changed: true ,
              }

              let el = {
                indice: element.timestamp ,
                value: element , //event.target.value,
                input: this.input ,
              };

              let index = this.dataSourceMat.data!
                .map( ( { timestamp } ) => timestamp )
                .indexOf( element.timestamp );
              this.dataSourceMat.data[ index ] = {
                ...this.dataSourceMat.data[ index ] ,
                ...element ,
              };
              this.dataSourceMat.data = [ ...this.dataSourceMat.data ];
              this.valueDataOutput.emit( el );
            }
          } );


        }
        this.deleteAllSelection();
      } );
  }

  taraturaParametri() {
    // Dobbiamo richiedere la taratura del periodo selezionato
    console.info( 'Taratura parametri' );
    this.dialogService.openDialogTaratura('Attiva')
      .pipe(
        tap( () => this.spinnerService.show( 'global' ) ),
        switchMap( ({start, end})  => this.datasServiceApi.setMeasureCorrection( this.input.parameter?.parametro?.key ?? '', start, end ))
      )
      .subscribe( {
      next: data => {
        let findIndex = this.input?.dataset!.findIndex( item => item.timestamp === data[ 0 ].timestamp );

        for (let i = 0 ; i < data.length; i++) {
          let dataset = this.input.dataset![i + findIndex];
          if ( dataset.verification_flag == 2 && dataset.tipologia_validaz != 'FFF' ) {
            dataset.valore_validato = data[i].valore_validato;
            let el = {
              indice: dataset.timestamp ,
              value: dataset , //event.target.value,
              input: this.input ,
            };
            dataset.changed = true;
            this.valueDataOutput.emit( el );
          }
        }
        this.spinnerService.hide( 'global' );
      } ,
      error: err => {

      } ,
      complete: () => {}
    } );
  }
}
