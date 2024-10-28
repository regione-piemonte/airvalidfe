/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild,} from '@angular/core';
import {MatDialog, MatDialogConfig, MatDialogRef,} from '@angular/material/dialog';
import {MatMenuTrigger} from '@angular/material/menu';
import {MatTable, MatTableDataSource} from '@angular/material/table';
import {catchError, EMPTY, filter, forkJoin, map, merge, mergeMap, Observable, of, pairwise, Subscription, switchMap, take, throwError, withLatestFrom,} from 'rxjs';
import moment from 'moment';
import {
  DialogAnnoSelectComponent,
  DialogColorPickerComponent,
  DialogEventiComponent,
  DialogExportCsvComponent,
  DialogParametersComponent,
  DialogRemoveParameterComponent,
  IVisibility
} from '@dialog/*';
import {IParameter, ObservableData} from '@models/dataService';
import {TranslateService} from '@ngx-translate/core';
import {DatalocksService, DatasService, SensorsService,} from '@services/core/api';
import {NgxSpinnerService} from 'ngx-spinner';
import {finalize} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {AppState} from '../../../state';
import {
  addGraficoNascosto,
  changeShowOriginalDataParametroAction,
  changeValoreParametroAction,
  deleteAllParametroAction,
  deselezioneParametroAction,
  registrazioneParametroAction,
  resetStateParametroAction,
  selectParametroAction,
  selectParametroTypeAction,
} from '@actions/*';
import {
  changePeriodoParametriSelector,
  changesMassiveSelector,
  listaParametriSelector,
  listGraficiWithoutOriginalSelector,
  parametriSelector,
  parametriSelectorWithParametroNascostoSelector,
  parametroSelector,
  parametroSelectorEventi,
  resetStateSelector,
  selectParametroRicaricato,
  stateLockValidazioneSelector,
} from '@selectors/*';
import {Dataset, IGrafico} from '@models/grafico';
import {ActionParametersType, TypeIconsToParameters, TypeLabelButton, TypeLabelRecord,} from '@models/utils_type';
import {IConfigDialogParameter, IData, IFormatExport, IStatus, Parametri,} from '@models/validazione';
import {ArrayStationType, PollingLockService,} from '@components/shared/validazione-parametri/services/polling-lock.service';
import {DataService} from '@services/core/data/data.service';
import {ExportCsvService} from '@services/core/utility/export-csv.service';
import IGetEventsResponse from '@models/eventi/getEvents';
import {DateSettingService, formatKeys} from "@services/core/utility/date-setting.service";
import {UtilityClass} from "@components/shared/utily/utily.class";
import {INameColor, IProsElement} from "@components/shared/validazione-parametri/model/validazione-parametri.model";
import {DialogService} from "@components/shared/dialogs/services/dialog.service";
import {IResponseLockWithName} from "@models/interface/BE/response/getLock";
import {UtilityService} from "@services/core/utility/utility.service";


export interface IPropsParametriOut {
  parametri: Array<IParameter>;
  deleteAction?: boolean;
  newParameters?: Array<IParameter>;
  reloadData?: Array<Dataset>;
  update?: boolean;
}

@Component({
  selector: 'app-validazione-parametri',
  templateUrl: './validazione-parametri.component.html',
  styleUrls: ['./validazione-parametri.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidazioneParametriComponent implements OnInit, OnDestroy, OnChanges {
  @Input() dataInput?: Observable<IParameter[]>;
  @Output() rowSelected = new EventEmitter<number | Array<number>>();
  @Output() paramsOutput = new EventEmitter<IPropsParametriOut>();
  @Output() visibilityNotValidDataSeries = new EventEmitter<IVisibility | null>();
  @Output() visibilitySeries: EventEmitter<any> = new EventEmitter();
  @Output() deleteSeries: EventEmitter<string> = new EventEmitter();
  @Output() changeColorSeries = new EventEmitter<INameColor>();
  @ViewChild('table') table: MatTable<IParameter> | undefined;
  @ViewChild(MatMenuTrigger) contextMenu?: MatMenuTrigger;
  parameters: Array<IParameter> = [];
  parametroSelezionato$ = this.storeService.select(parametroSelector);
  eventi$ = this.storeService.select(parametroSelectorEventi);
  onOpenModal: EventEmitter<any> = new EventEmitter();
  onCloseModal: EventEmitter<any> = new EventEmitter();
  dataSourceMat = new MatTableDataSource<IParameter>();
  dialogRefDragDrop: MatDialogRef<DialogEventiComponent> | undefined;
  stopEffect = false;
  displayedColumns = this._getColumns();
  items = [
    {id: 1, name: 'Item 1'},
    {id: 2, name: 'Item 2'},
    {id: 3, name: 'Item 3'},
  ];
  contextMenuPosition = {x: '0px', y: '0px'};
  disableExport = false;
  rowSelectedDx?: IParameter;
  status: any;
  subscription: Subscription = Subscription.EMPTY;
  arrayParameters: ArrayStationType = [];
  // Uso il parametri selector per creare il componente grafico
  listParametri$ = this.storeService.select(parametriSelector);
  stateLock$ = this.storeService.select(stateLockValidazioneSelector).pipe(
    filter(items => items.length > 0),
  )
  private stateLock: Array<IResponseLockWithName> = [];

  constructor(
    private dialog: MatDialog,
    private dataService: DataService,
    private readonly datasService: DatasService,
    private readonly sensorService: SensorsService,
    private csvService: ExportCsvService,
    private dialogService: DialogService,
    private dataLockService: DatalocksService,
    private pollingLockService: PollingLockService,
    private translate: TranslateService,
    private spinner: NgxSpinnerService,
    private readonly storeService: Store<AppState>,
    private readonly dataSettingService: DateSettingService,
    private readonly ref: ChangeDetectorRef,
    private readonly utilityService: UtilityService,
  ) {


  }

  /**
   * @description Metodo che controlla se il parametro è già presente nella lista, nel caso che lo sia lo rimuove
   * @param data IData
   * @returns void
   * @example
   * this._checkParametroToList(data);
   */
  private _checkParametroToList(data: IData | undefined) {
    if (data?.selected) {


      // Controlla se il parametro selezionato nella data esiste già in "parametri" e "data.selected.parametri"
      const filtroParametro = (value: Parametri) => data.selected.parametri.some(item => item.name === value.name);

      // Verifico se il parametro esiste già nella lista dei parametri della tabella
      const filtroTabella = (value: Parametri) => !this.dataSourceMat.data.some(item => item.parametro.key === value.key);

      // Filtra i parametri che sono selezionati ma non ancora presenti nella data table
      let allParameterToNames = !data.all || !data.all.length ? data.selected.parametri : data?.all.filter(filtroParametro);

      // Esegue ulteriori filtraggi sui parametri selezionati e non ancora presenti nella data table
      allParameterToNames = allParameterToNames.filter(filtroTabella);

      data!.selected = {
        ...data?.selected!,
        parametri: allParameterToNames ?? [],
      };
    }
  }

  /**
   * @description Metodo che aggiunge il parametro alla lista
   * @param data IData
   * @returns void
   * @example
   * this._addParametroToList(data);
   */
  private _addParametroToList(data: IData | undefined) {
    this._checkParametroToList(data!);
    let count = this.parameters.length;

    let {selected} = data!;
    selected.parametri.forEach((element, i) => {
      let param = this.dataService.createParameter(
        count,
        selected,
        element,
        selected?.status?.[i]
      );
      // console.info('parametro', param);
      // console.table(this.parameters);
      this.parameters = this.compareNewObj(this.parameters, param);
      if (
        selected.areeTerritoriali
          .filter(({key}) => key === element.key.substring(0, element.key.indexOf('.')))[0]
          .extraInfo.includes('write')
      ) {
        this.arrayParameters.push(
          this.dataLockService.setSensorStateLock(element.key)
        );
      }
    });

    this.pollingLockService.setArray(this.arrayParameters);
  }

  /**
   * @description Metodo che formatta la data in base al formato selezionato
   * @param format string
   * @returns string
   * @example
   * let newFormat = this._formatDate('DD/MM/YYYY HH:mm');
   * console.info(newFormat);
   * // output: dd/mm/yyyy HH:mm
   */
  private _formatDate(format: string): string {
    let obj: Record<string, string> = {
      'DD/MM/YYYY HH:mm': 'dd/MM/yyyy HH:mm',
      'MM/DD/YYYY HH:mm': 'MM/dd/yyyy HH:mm',
      'YYYY-MM-DD HH:mm': 'yyyy-MM-dd HH:mm',
    };
    return obj[format];
  }

  /**
   * Get the pros element for the given parameter.
   *
   * @param {IParameter} element - The parameter to retrieve the pros element from.
   * @returns {IProsElement} The pros element with properties locked, virtual and extraInfo.
   */
  private _getProsElement(element: IParameter): IProsElement {
    let locked = element.locked;
    let virtual = element.parametro.virtual ?? false;
    let extraInfo = element.parametro.extraInfo;
    let key = element.parametro.key;
    return {locked, virtual, extraInfo, key};
  }

  /**
   * Retrieves the record label based on the given element and optional parameter.
   *
   * @param {TypeLabelRecord} element - The element to retrieve the record label for.
   * @param {IParameter} [parametro] - An optional parameter for additional information.
   * @param key
   *
   * @return {TypeIconsToParameters | TypeLabelButton} The record label based on the element.
   */
  private _getRecordLabel<T>(element: TypeLabelRecord, parametro?: T, key?: keyof T): TypeIconsToParameters | TypeLabelButton {
    let obj: Record<string, TypeIconsToParameters | TypeLabelButton> = {
      virtual: 'menu_book',
      write: 'mode_edit',
      advanced: 'mode_edit',
      lock: 'lock',
      btn_read_only: 'button.aria_label.read_only',
      btn_user_lock: `${this.translate.instant('button.aria_label.user_lock')} ${parametro && key ? parametro[key] : ''}`,
      btn_writing: 'button.aria_label.writing',
    };
    return obj[element];
  }

  /**
   * Reloads parameters based on data received from the data service.
   *
   * @private
   * @void
   */
  private _reloadParameters(): void {
    this.dataService.reloadParameterObs$
      .pipe(filter((data) => !!Object.keys(data).length))
      .subscribe(({index, dataset, parameter}) => {
        // console.info('parametro da ricaricare', { index, dataset, parameter });
        this.paramsOutput.emit({parametri: this.parameters.filter(par => par.parametro.key === parameter!.parametro!.key), reloadData: dataset});
        this.parameters[index!] = {
          ...this.parameters[index!],
          visibleNotValid: false,
          visible: true
        };
        this.dataSourceMat.data = this.dataSourceMat.data.map((item, i) => i === index ? ({...item, visible: true}) : item);
        this.table?.renderRows();
      });
  }

  /**
   * Checks the parameters and performs certain actions based on the conditions.
   *
   * @private
   * @returns {void}
   */
  private _checkParameters(): void {
    this.dataService.isSavedStream$.subscribe((res) => {
      this.disableExport = res;
    });
  }

  /**
   * Validates the parameters of the component.
   * Performs various operations like filtering, tapping and switching.
   * Subscribes to observables and updates the component's data accordingly.
   *
   * @private
   * @method _validateParametersComponent
   * @return {void}
   */
  private _validateParametersComponent(): void {
    this.storeService
      .select(listaParametriSelector)
      .pipe(
        // tap(data => console.info(data)),
        // startWith(0),
        // filter((data) => !!data),
        pairwise(),
        filter(([first, last]) => first !== last),
        withLatestFrom(this.storeService.select(parametriSelectorWithParametroNascostoSelector).pipe(pairwise())),
        map(([[first, last], [hold, parametri]]) => ({first, last, parametri, hold}))
      )
      .subscribe(({first = 0, last = 0, parametri = [], hold = []}) => {
        console.info('leggo la lunghezza della lista', {first, last});
        // console.info('Val data input', parametri);
        let hasDelete = (last || 0) < (first || 0);
        let hasAdd = (first || 0) < (last || 0);
        let newParameters: IParameter[] = [] as IParameter[];
        if (hasAdd) {
          newParameters = UtilityClass.getElementToLastList(hold, parametri);

        }
        this.parameters = parametri || [];

        this.dataSourceMat.data = parametri || [];

        this.pollingLockService.setArray(this.arrayParameters);
        this.pollingLockService.setListParametriToPolling(
          this.dataLockService.getALlLockOfListParameters(parametri || [])
        );
        // if (!deepCompare.some(item => item.includes('visibleOrigin') || item.includes('visibleNotValid'))) {
        // }
        this.paramsOutput.emit({parametri: this.parameters, deleteAction: hasDelete, newParameters});
        this.table?.renderRows();
        this.ref.detectChanges();
      });
  }

  /**
   * Handles the data update.
   *
   * @private
   *
   * @returns {void}
   */
  private _handleDataUpdate(): void {
    this.dataService.dataObs$.pipe(filter((data) => !!data)).subscribe({
      next: (data) => {
        // console.info('data output', data);
        this._addParametroToList(data!);
        this.dataSourceMat.data = [...this.parameters];
        this.paramsOutput.emit({parametri: this.parameters});
        this.ref.detectChanges();
      },
    });
  }

  /**
   * Updates the visible origin of data elements based on the selected parameter.
   *
   * @private
   *
   * @returns {void} - This method does not return a value.
   */
  private _updateVisibleOrigin(): void {
    this.storeService
      .select(selectParametroRicaricato)
      .pipe(filter((keyParametro) => !!keyParametro))
      .subscribe((keyParametro) => {
        this.dataSourceMat.data = this.dataSourceMat.data.map((element) =>
          element.parametro.key === keyParametro
            ? {...element, visibleOrigin: false}
            : element
        );
        this.parameters = this.parameters.map((element) =>
          element.parametro.key === keyParametro ? {...element, visibleOrigin: false} : element
        );
        this.table?.renderRows();
        this.storeService.dispatch(changeValoreParametroAction(''));
      });
  }

  /**
   * Compare the objects in an array with another array of objects and return an array
   * containing the objects that have unique 'parametro.key' values.
   *
   * @param {Array<IParameter>} parameters - The array of objects to compare.
   * @param {Array<IParameter>} params - The array of objects to compare against.
   * @return {Array<IParameter>} - An array containing the objects with unique 'parametro.key' values.
   */
  private compareObjToArray(parameters: Array<IParameter>, params: Array<IParameter>): Array<IParameter> {
    let list = [...parameters, ...params];
    return list.filter((item, index) => list.findIndex(i => i.parametro.key === item.parametro.key) === index);
  }

  /**
   * Compare a new object with a list of existing objects and either update the existing object or add the new object to the list.
   * @param {Array<IParameter>} parameters - The list of existing objects to compare against.
   * @param {IParameter} param - The new object to compare.
   * @returns {Array<IParameter>} - The updated list of objects.
   */
  private compareNewObj(parameters: Array<IParameter>, {parametro: par, ...obj}: IParameter): Array<IParameter> {
    // Ricerco se all'interno di parameters esista la stessa key del parametro
    if (parameters.some(({parametro}) => parametro.key === par.key)) {
      return parameters;
    }
    return [...parameters, {...obj, parametro: {...par}}];

  }

  /**
   * Private method to retrieve the columns for a certain table.
   *
   * @return {Array} An array containing the column names.
   */
  private _getColumns(): ReadonlyArray<string> {
    return [
      'Eventi',
      'Parametro',
      //'Area Terr.',
      'Stazione',
      'symbol',
    ];
  }

  /**
   * Handles the state reset for parameters by observing changes in the reset state
   * selector and triggering the necessary actions to reset the parameters.
   * It listens for a reset state change and, if detected, initiates the process
   * to lock the list of parameters, and then sets the component state accordingly.
   *
   * @return {void} This method does not return a value.
   */
  private _handleListenResetStateParametro(): void {
    this.storeService.select(resetStateSelector)
      .pipe(
        filter(reset => reset),
        switchMap(reset => this.dataLockService
          .setLockOfListParameters([]).pipe(
            map(() => reset)
          )),
      )
      .subscribe((reset) => this._setStateComponentParametri(reset))
  }

  /**
   * Updates the state of component parameters and stops various polling and timer services.
   *
   * @param {boolean} value - The boolean value indicating a state change.
   * @return {void} This method does not return a value.
   */
  private _setStateComponentParametri(value: boolean): void {
    console.info(value);
    this.pollingLockService.stopPolling.next(true);
    this.dataLockService.stopTimer();
    this.arrayParameters = [];
    this.dataSourceMat.data = [];
    this.table?.renderRows();
    this.parameters = [];
    this.storeService.dispatch(deleteAllParametroAction());
  }

  /**
   * Initializes the component.
   * - Subscribes to reload parameters.
   * - Subscribes to the isSavedStream$ from the dataService to set the disableExport flag.
   * - Performs operations on the dataInput stream:
   *   - Filters out empty data.
   *   - Logs the response.
   *   - Performs operations based on the listParameter:
   *     - Sets lock on parameters that have extraInfo containing "write" or "advanced".
   *     - Returns the listParameter if no lock is set.
   *   - Retrieves the status of the lock for each parameter in the listParameter.
   * - Updates the parameters, dataSourceMat, and arrayParameters based on the listParameterStatus.
   * - Sets the arrayParameters in the pollingLockService.
   * - Unsubscribes from the previous polling subscription if it exists, then subscribes to the pollingLockService.
   * - Subscribes to the dataObs$ from the dataService:
   *   - Filters out empty data.
   *   - Adds the data to the parameter list and updates the dataSourceMat.
   *   - Emits the parameters through the paramsOutput event emitter.
   * - Subscribes to the selectParametroRicaricato from the storeService:
   *   - Filters out empty data.
   *   - Updates the dataSourceMat and parameters to hide the parameter with the matching key.
   *   - Dispatches a redux action to change the value of the selected parameter.
   */
  ngOnInit(): void {
    this._reloadParameters();
    this._checkParameters();
    this._validateParametersComponent();
    this._handleDataUpdate();
    this._updateVisibleOrigin();
    this._handleListenResetStateParametro();
    /* 2 event emitter per aprire e chiudere la modale eventi e che controlla che ci sia solo
    una modale aperta in pagina
    this.onOpenModal,
      this.onCloseModal
    */
    merge(this.onOpenModal, this.onCloseModal).subscribe((data) => {
      if (data === this.dialogRefDragDrop) {
        data.close();
      } else {
        this.dialogRefDragDrop = this.dialog.open(DialogEventiComponent, {
          data: data,
          disableClose: true,
          hasBackdrop: false,
          panelClass: 'eventi--panel',
          backdropClass: 'backdropClass',
        });

        this.dialogRefDragDrop.afterClosed().subscribe((data) => {
          // console.info(data);
        });
      }
    });

    // Ricevo lo state da usare per le icone
    this.stateLock$.subscribe(data => {
      this.stateLock = data;
      this.ref.detectChanges();
    });

    this.storeService.select(changePeriodoParametriSelector)
      .pipe(
        filter(periodo => !!periodo),
      )
      .subscribe({
        next: periodo => {
          this.parameters = this.parameters.map((element) => ({...element, selected: false}));
          this.dataSourceMat.data = this.parameters;
          this.table?.renderRows();
          // tolgo la selezione del parametro
          this.storeService.dispatch(deselezioneParametroAction());
          this.dataService.resetSelectedParameter();
          this.dataService.setTaratura([]);
          this.paramsOutput.emit({parametri: this.parameters, deleteAction: false, newParameters: []})
        },
        error: err => console.info('Errore', err),
        complete: () => console.info('selector complete')
      })
  }

  ngOnChanges(changes: SimpleChanges) {
    console.info(changes);
  }

  /**
   * Handles the selection of a row in the table. If the row is already selected, no action is taken.
   * If the row is not already selected and certain criteria are met, it makes the row visible,
   * updates the data source with the selection, dispatches an action to update the store and
   * sets various states within the data service.
   *
   * @param {number} row - The index of the row to be selected.
   * @param {IParameter} element - The parameter element of the row.
   * @return {void}
   */
  selectedRow(row: number, element: IParameter): void {

    // Nel caso che il parametro sia stato selezionato non faccio nulla
    if (element.selected) {
      return;
    }
    this.storeService
      .select(parametroSelector)
      .pipe(
        filter((parametro) => !parametro || parametro.parameter.parametro.key !== element.parametro.key
        ),
        withLatestFrom(this.storeService.select(changesMassiveSelector)),
        map(([parametro, lista]) => ({parametro, lista})),
        take(1)
      )
      .subscribe(({parametro, lista}) => {

        if (
          this.dataService.getToSaveValue().size > 0 ||
          (lista && lista.length > 0)
        ) {
          this.openInfoDialog();
        } else {
          // Verifico se la tratta e visibile, nel caso che non lo fosse la devo rendere visibile oppure devo evitare che la possa selezionare
          if (!element.visible) {
            element.visible = true;
            this.visibilitySeries.emit(
              element.parametro.name + ' - ' + element.stazione.name
            );
            this.storeService.dispatch(addGraficoNascosto(element.parametro.key));
          }
          this.dataSourceMat.data = [
            ...this.dataSourceMat.data.map((element, index) => ({
              ...element,
              selected: index === row,
            })),
          ];

          // this.table?.renderRows();
          // this.rowSelected.emit(row);

          let el: ObservableData = {
            parameter: this.dataSourceMat.data[row],
            index: row,
          };

          this.storeService.dispatch(
            selectParametroAction({parametro_selezionato: el})
          );


          // console.info(performanceMeasure.toJSON());
          // console.info(performanceMeasureDisp.toJSON());
          // console.info(performanceMeasureEnd.toJSON());
          this.dataService.setSelectedParameter(el);
          this.dataService.setTaratura([]);
          this.rowSelectedDx = element;
        }
      });
  }


  /**
   * @description Mostra il dialog per la conferma della eliminazione di tutti i parametri
   */
  openDialogDeleteAll() {
    this.utilityService.checkDelete().pipe(
      filter((data) => data),
    )
      .subscribe({
        next: () => {
          //  Elimina tutto la lista dei parametri
          this.storeService.dispatch(resetStateParametroAction(true));
          this.visibilityNotValidDataSeries.emit(null);
        },
      });
  }

  /**
   * Opens a dialog for events.
   *
   * @param {Array<IGetEventsResponse>} data - An array containing event data to be passed to the dialog.
   * @return {void}
   */
  openDialogEventi(data: Array<IGetEventsResponse>): void {
    if (this.dialogRefDragDrop) {
      // this.dialogRefDragDrop.close();
      this.onCloseModal.emit(this.dialogRefDragDrop);
    }
    this.onOpenModal.emit(data);
    if (!this.stopEffect) {
      this.stopEffect = true;
    }
  }

  /**
   * @description Dialog per aggiunta nuovi parametri
   */
  openDialog() {
    const dialogConfig: MatDialogConfig<IConfigDialogParameter> =
      new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1,
      title: 'Selezione parametri',
    };

    const dialogRef: MatDialogRef<DialogParametersComponent, IData> =
      this.dialog.open(DialogParametersComponent, dialogConfig);
    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        switchMap((val) => {
          // Verifico che ci siano dei parametri non virtuali e che abbia criteri di scrittura
          const hasNonVirtualParameters = val?.selected.parametri.some((item) => {
            let hasWriteOrAdvanced = item.extraInfo.includes('write') || item.extraInfo.includes('advanced');
            let parameterVirtual = item.virtual;
            return hasWriteOrAdvanced && !parameterVirtual;
          });
          if (hasNonVirtualParameters) {

            return !!val ? forkJoin(
              val!.selected.parametri.map((element, index) => {
                if (!element.virtual && (element.extraInfo.includes('write') || element.extraInfo.includes('advanced'))) {
                  return this.dataLockService.setSensorStateLock(element.key)
                    .pipe(
                      map((res) => ({statusLock: {...res}, index}))
                    )
                }
                return of<IStatus>({
                  statusLock: {
                    locked: false,
                    myLock: false,
                    userInfo: '',
                    year: 0,
                    date: 0,
                    measurementID: element.key,
                    measurementId: element.key,
                    userID: '',
                    userId: undefined
                  },
                  index
                })
              })
            ).pipe(
              map<IStatus[], IData>((value) => ({
                ...val!,
                selected: {...val!.selected, status: [...value]},
              }))
            ) : EMPTY;
          }
          return of(val)
        }),
        filter(value => !!value),
      )
      .subscribe((data) => {
        // console.info('data output', data);
        this._addParametroToList(data);
        let filteredParameters = this.parameters.filter((parameter) => !this.dataSourceMat.data.some((data) => data.parametro.key !== parameter.parametro.key));
        this.dataSourceMat.data = [...this.dataSourceMat.data, ...filteredParameters];
        this.table?.renderRows();
        // this.paramsOutput.emit({parametri: this.parameters});
        this.storeService.dispatch(registrazioneParametroAction({
            parametri: this.parameters,
            reload: true,
          })
        );
      });
  }

  openInfoDialog() {
    this.dialogService.openInfoDialog(
      'Attenzione',
      'Sono presenti dati modificati. <br/>Procedere con il salvataggio o ripristinare il dataset'
    );
  }

  openRemoveParameterDialog() {
    let dialogConfig = new MatDialogConfig();
    dialogConfig = {
      ...dialogConfig,
      disableClose: true,
      autoFocus: true,
      data: {id: 1, title: 'Selezione parametri'},
    }

    // Apre la modale per poter selezionare i parametri da eliminare
    const dialogRef = this.dialog.open(
      DialogRemoveParameterComponent,
      dialogConfig
    );

  }

  openDialogExport() {
    const dialogConfig: MatDialogConfig<IConfigDialogParameter> = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1,
      title: 'Esportazione Parametri',
    };

    const dialogRef: MatDialogRef<DialogExportCsvComponent, IFormatExport> =
      this.dialog.open(DialogExportCsvComponent, dialogConfig);
    dialogRef
      .afterClosed()
      .pipe(
        switchMap((val) =>
          this.storeService.select(listGraficiWithoutOriginalSelector).pipe(
            take(1),
            map((grafici) => ({grafici, data: val}))
          )
        )
      )
      .subscribe({
        next: ({grafici, data}) => {
          if (data) {
            // console.info('data export', data);
            // console.info('DATI CVSSSSS', this.dataService.getDataset());
            this.saveAsCSV(data, grafici);
          }
        },
      });
  }

  openDialogAnno(item: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1,
      title: 'Esportazione Parametri',
    };

    const dialogRef = this.dialog.open(DialogAnnoSelectComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        // console.info('data export', data);
        this.loadConfronto(item, data.anno);
      }
    });
  }

  /**
   * @description Metodo per la creazione del file csv
   * @param settings
   * @param grafici
   */
  saveAsCSV(settings: IFormatExport, grafici: ReadonlyArray<IGrafico>) {
    const items: any[] = [];
    // console.info('Data filtered csv', this.dataService.getDatasetFiltered());
    let notExported = true;
    // riformatto la data per il csv
    settings = {
      ...settings,
      dataFormat: this._formatDate(settings.dataFormat),
    };

    grafici.forEach((element) => {
      if (element.visible && !element.parametro.key.includes('|')) {
        element.dataset.forEach((elementDataSet) => {
          let {day, hours} = this.dataSettingService.generateDataAndHours(elementDataSet.timestamp, settings.dataFormat.split(' ')[0].toUpperCase() as formatKeys, true);
          if (settings.type == 'Basic') {
            /** Nella export basic non si fa vedere il valore_originale
             *  inoltre si mostrano soltanto i valori_validati con verification flag diverso da 3 (quindi si visualizzano solo i lvalori validati e certificati)
             *  Non si mostrano nemmeno i valori validati non validi. In questo caso si mostra solo il validty flag che sara' -1 o -99
             **/
            let csvLine = {
              nome_stazione: element.stazione.name,
              nome_parametro: element.parametro.name,
              data: day,
              ora: hours,
              valore_validato: elementDataSet.valore_validato == null ? "" : elementDataSet.valore_validato.toFixed(element.parametro.decimalDigits)
                ? settings.numberSeparator == '.'
                  ? (elementDataSet.verification_flag == 3 || (elementDataSet.verification_flag != 3 && elementDataSet.validity_flag < 0)) ? '' : elementDataSet.valore_validato.toFixed(element.parametro.decimalDigits)
                  : (elementDataSet.verification_flag == 3 || (elementDataSet.verification_flag != 3 && elementDataSet.validity_flag < 0)) ? '' : elementDataSet.valore_validato.toFixed(element.parametro.decimalDigits).toString().replace('.', ',')
                : elementDataSet.valore_validato.toFixed(element.parametro.decimalDigits),
              validity_flag: elementDataSet.verification_flag == 3 ? '' : elementDataSet.validity_flag,
              verification_flag: elementDataSet.verification_flag,
            };
            items.push(csvLine);
          } else {
            let csvLine = {
              nome_stazione:
                element.name.split('-')[1] + '-' + element.name.split('-')[2],
              nome_parametro: element.name.split('-')[0],
              id_rete_monitoraggio: element.parametro.key.split('.')[0],
              codice_istat_comune: element.parametro.key.split('.')[1],
              progr_punto_com: element.parametro.key.split('.')[2],
              id_parametro: element.parametro.key.split('.')[3],
              data: day,
              ora: hours,
              valore_originale: elementDataSet.valore_originale
                ? settings.numberSeparator == '.'
                  ? elementDataSet.valore_originale
                  : elementDataSet.valore_originale.toString().replace('.', ',')
                : elementDataSet.valore_originale,
              valore_validato: elementDataSet.valore_validato == null ? "" :
                elementDataSet.valore_validato.toFixed(element.parametro.decimalDigits)
                  ? settings.numberSeparator == '.'
                    ? elementDataSet.valore_validato.toFixed(element.parametro.decimalDigits)
                    : elementDataSet.valore_validato.toFixed(element.parametro.decimalDigits).toString().replace('.', ',')
                  : elementDataSet.valore_validato.toFixed(element.parametro.decimalDigits),
              tipologia_validaz: elementDataSet.tipologia_validaz,
              flag_validaz_autom: elementDataSet.flag_validaz_autom,
              validity_flag: elementDataSet.validity_flag,
              verification_flag: elementDataSet.verification_flag,
              da_rivedere: elementDataSet.da_rivedere,
              data_agg: this.dataSettingService.generateNameToTimeStamp({timestamp: elementDataSet.data_agg, separatore: ' ', formatter: settings.dataFormat}),
            };
            items.push(csvLine);
          }
        });
        notExported = false;
      }
    });

    if (notExported) {
      this.dialogService.openInfoDialog(
        'Attenzione',
        'Non ci sono parametri visibili da esportare'
      );
    }

    this.csvService.exportToCsv(
      'AriaWeb_export_' + moment().format('DD_MM_YYYY_HH_mm_ss') + '.csv',
      items,
      settings.dataSeparator
    );
  }

  clickVisibilityButton(element: IParameter, index: number) {
    if (this.dataService.getToSaveValue().size > 0) {
      this.openInfoDialog();
    } else {
      const updatedData = [...this.dataSourceMat.data];

      updatedData[index] = {
        ...element,
        visible: !element.visible,
      };

      this.dataSourceMat.data = updatedData;
      this.storeService.dispatch(addGraficoNascosto(element.parametro.key));
      // emetto l'evento per dire che riga è stata selezionata
      // this.rowSelected.emit(index);
      // imposto il parametro selezionato
      // let el: ObservableData = {
      //   parameter: element,
      //   index: index,
      // };
      // imposto il parametro selezionato
      // this.dataService.setSelectedParameter( el );
      // Emetto l'evento per dire che la visibilità è cambiata
      this.visibilitySeries.emit(
        element.parametro.name + ' - ' + element.stazione.name
      );
    }
  }

  /**
   * Handles the context menu event for the given item. If the item corresponds to the currently
   * selected row, prevents the default context menu from appearing and opens a custom context menu
   * at the position of the mouse event.
   *
   * @param {MouseEvent} event - The mouse event that triggered the context menu.
   * @param {IParameter} item - The item associated with the context menu event.
   * @return {void}
   */
  onContextMenu(event: MouseEvent, item: IParameter): void {
    if (
      this.rowSelectedDx &&
      this.rowSelectedDx.parametro.key == item.parametro.key &&
      this.rowSelectedDx.stazione.key == item.stazione.key
    ) {
      event.preventDefault();
      this.contextMenuPosition.x = event.clientX + 'px';
      this.contextMenuPosition.y = event.clientY + 'px';
      if (this.contextMenu) {
        this.contextMenu.menuData = {item: item};
      }

      // this.contextMenu?.menu.focusFirstItem('mouse');
      this.contextMenu?.openMenu();
    }
  }

  /**
   * @description Metodo per la gestione delle azioni del menu contestuale
   * @param item IParameter
   * @param action ActionParametersType
   * @returns void
   * @example
   * this.onContextMenuAction(item, 'confronta');
   */
  onContextMenuAction(item: IParameter, action: ActionParametersType | null) {
    switch (action) {
      //  Nel caso che voglia confrontare i dati nel tempo
      case 'confronta':
        this.openDialogAnno(item);
        break;
      //   Nel caso che voglia eliminare il parametro
      case 'delete':
        this.utilityService.checkDelete(item)
          .pipe(
            filter(value => value),
          )
          .subscribe(
            {
              next: res => {
                this.pollingLockService.setArray(this.arrayParameters);
                let name = UtilityClass.getAParameterAndStationName(item)

                this.deleteSeries.next(name);
                this.rowSelected.emit([]);
                // cancello lista dati modificati
                this.dataService.clearSaveValue();
                this.visibilityNotValidDataSeries.emit(null);
              },
              error: err => {
                console.error(err);
              },
              complete: () => {
                console.info('Complete');
              }
            });

        break;
      //   Nel caso che non voglia far visualizzare i dati originari
      case 'showOriginData':
        // Indice parametro selezionato su qui effettuare l'azione
        let indexOrigin = UtilityClass.getIndex(this.dataSourceMat.data, 'parametro', item.parametro.key, 'key');
        let hasOrigin = !this.dataSourceMat.data[indexOrigin].visibleOrigin;
        this.storeService.dispatch(changeShowOriginalDataParametroAction(hasOrigin));
        this.dataSourceMat.data = this.dataSourceMat.data.map((element) => {
          if (element.parametro.key === item.parametro.key) {
            return {
              ...element,
              visibleOrigin: hasOrigin
            };
          }
          return element;
        });
        this.visibilitySeries.emit(UtilityClass.getParameterAndStationWithOrigin(item));
        this.table?.renderRows();
        break;
      //   Nel caso che voglia cambiare il colore della serie
      case 'color-picker':
        this.openColorPickerDialog(item);
        break;
      //   Nel caso che non voglia far visualizzare i dati non validi
      case 'notShowNotValidData':
      //   Nel caso che voglia far visualizzare i dati non validi
      case 'showNotValidData':
        // creo una variabile per indicare se il valore del parametro è visibile o meno
        let visibleNotValid = action === 'showNotValidData' ? 1 : 0;
        // console.info('Mostra nascondi dati non validi');
        // Faccio un dispatch per cambiare il valore della tipo action
        this.storeService.dispatch(selectParametroTypeAction(action));
        // index ricercato dalla lista dei parametri
        let index = this.parameters
          .map(({parametro}) => parametro.key)
          .findIndex((key) => key == item.parametro.key);

        let check = (element: IParameter) => element.parametro.key === item.parametro.key;
        let upDate = (element: IParameter) => ({
          ...element,
          visibleNotValid: action === 'showNotValidData'
        });
        let callback = (element: IParameter, index: number) => check(element) ? upDate(element) : element;

        this.dataSourceMat.data = this.dataSourceMat.data.map(callback);

        // console.info('series index', this.parameters[index]);

        // // cambio il valore del parametro indicato
        // this.dataSourceMat.data = this.dataSourceMat.data.map((element) => {
        //   if (element.parametro.key === item.parametro.key) {
        //     return {
        //       ...element,
        //       visibleNotValid: action === 'showNotValidData'
        //     };
        //   }
        //   return element;
        // });

        this.table?.renderRows();

        let checkParametro = (i: number) => i !== index;
        let callbackParametro = (element: IParameter, i: number) => checkParametro(i) ? element : upDate(element)
        this.parameters = this.parameters.map(callbackParametro);

        // this.parameters = this.parameters.map((parameter, i) => {
        //   if (i !== index) {
        //     // return the unmodified item
        //     return parameter;
        //   }
        //
        //   // create a new item and override the 'visibleNotValid' property
        //   return {
        //     ...parameter,
        //     visibleNotValid: action === 'showNotValidData',
        //   };
        // });
        this.pollingLockService.setListParametriToPolling(
          this.dataLockService.getALlLockOfListParameters(this.parameters)
        );
        this.visibilityNotValidDataSeries.emit({
          name: item.parametro.name + ' - ' + item.stazione.name,
          visibilityNotValid: visibleNotValid,
        });
        break;
      //   Nel caso che voglia far visualizzare i dati correlati del parametro
      case 'parametri-correlati':
        this.spinner.show('global');
        this.sensorService.getSensoriCorrelati(item.parametro.key)
          .pipe(
            mergeMap((lista) => {
              if (lista.length === 0) {
                return throwError(() => ({
                  message: 'Non sono presenti parametri correlati',
                }));
              }
              return of(lista)
            }),
            finalize(() => this.spinner.hide('global'))
            // switchMap( ( lista ) =>  forkJoin(lista.map(({sensorName}) => this.datasService.getSensorData(sensorName.key, sensorName.measurementPeriod))) ) ,
          )
          .subscribe({
            next: (res) => {
              // console.info('Parametri correlati', res);

              let {sensorNamesList, sensorNames, stationNames, networkNames} = this.dataService.createData(res);

              let data: IData = {
                selected: {
                  areeTerritoriali: networkNames,
                  stazioni: stationNames,
                  parametri: sensorNamesList,
                },
                all: sensorNames
              }

              let params = [
                ...data.all
                  .filter(({name}) =>
                    data.selected.parametri.some(
                      ({name: nameSelected}) => nameSelected == name
                    )
                  )
                  .map((element) =>
                    this.dataService.createParameter(0, data.selected, element)
                  ),
              ];

              let iParameters = this.compareObjToArray(this.parameters, params);

              this.storeService.dispatch(registrazioneParametroAction({parametri: [...iParameters], reload: false}));

              this.dataService.setData(data);

              // this.dialogService.openInfoDialog('Parametri correlati', res);
            },
            error: (err) => {
              // console.info(err);
              this.dialogService.openInfoDialog(
                'Parametri correlati',
                err.message
              );
            },
            complete: () => {
            },
          });
        break;
      //   Nel caso che voglia far visualizzare i dati della taratura
      case 'taratura':
        this.storeService.select(parametroSelector).pipe(
          take(1),
          mergeMap(par => !par || par.parameter.parametro.key !== item.parametro.key ? throwError(() => 'Nessun parametro selezionato') : of(par)),
          switchMap(par => {
            this.spinner.show('global');
            // Prendo il parametro selezionato dallo state
            let data = this.dataService.getParametersList()?.dataset || [];
            return this.datasService.getCalibrations(
                item.parametro.key,
                data[0].timestamp,
                data[data.length - 1].timestamp
              ).pipe(
                // catchError(err => throwError(() => 'Errore di taratura'))
            )
          }),
          finalize(() => this.spinner.hide('global'))
        ).subscribe({
          next: (taratura) => {
            this.dataService.setTaratura(taratura);
          },
          error: (err) => {
            this.spinner.hide('global');
            this.dataService.setTaratura([]);
            this.dialogService.openInfoDialog(
              'Taratura',
              err.message
            );
          }
        })
        break;
      //   Nel caso che siano presenti altri tipi di azioni
      default:
        break;
    }
  }

  loadConfronto(item: IParameter, anno: number) {
    // console.info('Avvio confronto nel tempo');
    // console.info('parameters', this.parameters);
    // Index Parameter
    const index = this.parameters
      .map(({parametro}) => parametro.key)
      .indexOf(item.parametro.key);
    console.info('ìndex', index);
    // Creo un nuovo elemento per il confronto
    let elemento: IParameter = JSON.parse(
      JSON.stringify(this.parameters[index])
    );
    // Modifico i valori mantenendo la immutabilità
    elemento = {
      ...elemento,
      parametro: {
        ...elemento.parametro,
        key: elemento.parametro.key + '|' + anno,
        name: elemento.parametro.name + '-' + anno,
      },
      locked: true,
      visibleNotValid: false,
      visibleOrigin: false,
    };
    // Aggiungo il nuovo elemento alla lista
    this.parameters = [...this.parameters, elemento];
    // Aggiorno la lista
    this.dataSourceMat.data = [...this.parameters];
    // Setto la lista dei parametri per il polling
    this.pollingLockService.setListParametriToPolling(
      this.dataLockService.getALlLockOfListParameters(this.parameters)
    );
    // aggiorno la lista dei parametri nello store
    this.storeService.dispatch(
      registrazioneParametroAction({
        parametri: this.parameters,
        reload: false,
      })
    );
    // Emetto l'evento per dire che la serie è stata aggiunta
    // this.paramsOutput.emit({parametri: this.parameters});
  }

  tooltipInfoText(element: IParameter) {
    let textTooltip = '';
    textTooltip += element.visibleOrigin
      ? `${this.translate.instant('button.tooltip.show_data')}`
      : `${this.translate.instant('button.tooltip.not_show_data')}`;
    textTooltip += '\n';
    textTooltip += element.visibleNotValid
      ? `${this.translate.instant('button.tooltip.valid_data')}`
      : `${this.translate.instant('button.tooltip.not_valid_data')}`;
    return textTooltip;
  }

  openColorPickerDialog(item: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 2,
      title: 'Selezione Colori',
    };

    const dialogRef = this.dialog.open(
      DialogColorPickerComponent,
      dialogConfig
    );

    dialogRef.afterClosed().subscribe((data: string) => {
      if (data) {
        let index = this.parameters.findIndex(
          ({parametro}) => parametro.key === item.parametro.key
        );
        this.parameters[index].color = data;
        this.dataSourceMat.data = this.dataSourceMat.data.map((element, i) =>
          i === index ? {...element, color: data} : element
        );
        this.table?.renderRows();
        let configColor = {
          name: item.parametro.name + ' - ' + item.stazione.name,
          color: data,
        };
        this.changeColorSeries.emit(configColor);
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();

    console.info('ngOnDestroy parametro component');
  }

  getIcons(element: IParameter, type: 'label' | 'button' = 'label'): TypeIconsToParameters | TypeLabelButton {
    let {locked, virtual, extraInfo, key} = this._getProsElement(element);
    let isLabel = type === 'label';
    if (virtual || key.includes('|')) {
      return this._getRecordLabel(isLabel ? 'virtual' : 'btn_read_only');
    }
    if (locked) {
      return this._getRecordLabel(isLabel ? 'lock' : 'btn_user_lock', element, 'userLock');
    }
    if (extraInfo.includes('write') || extraInfo.includes('advanced')) {
      return this._getRecordLabel(isLabel ? 'write' : 'btn_writing');
    }

    if (!locked && !extraInfo) {
      return this._getRecordLabel(isLabel ? 'virtual' : 'btn_read_only');
    }
    return this._getRecordLabel(isLabel ? 'lock' : 'btn_user_lock');
  }

  getIconsToState(element: IParameter, type: 'label' | 'button' = 'label'): string {
    return this.verifyStateLockAndDestructure(element, props => {
      let {locked, myLock, parametro, virtual, extraInfo,} = props;
      if (virtual || parametro?.key.includes('|')) {
        return this._getRecordLabel('virtual');
      }
      if (myLock) {
        if (parametro?.extraInfo.includes('write') || parametro?.extraInfo.includes('advanced')) {
          return this._getRecordLabel('write');
        }
      }
      if (!myLock) {
        // altro
        if (locked) {
          return this._getRecordLabel('lock');
        }
        if (!locked && !extraInfo) {
          return this._getRecordLabel('virtual');
        }
      }
      return '';
    })
  }

  getTranslateTooltip(element: IParameter & { extraInfo: string, virtual: boolean }): string {
    return this.verifyStateLockAndDestructure(element, props => {
      let {locked, myLock, parametro, virtual, extraInfo} = props;
      if (virtual || parametro?.key.includes('|')) {
        return this._getRecordLabel('btn_read_only');
      }
      if (locked && !myLock) {
        return this._getRecordLabel('btn_user_lock', props, 'userInfo');
      }

      if (extraInfo.includes('write') || extraInfo.includes('advanced') && (myLock && locked)) {
        return this._getRecordLabel('btn_writing');
      }

      if (!locked && !extraInfo) {
        return this._getRecordLabel('btn_read_only');
      }
      return ''
    })

  }


  verifyStateLockAndDestructure(element: IParameter, callback: (value: IResponseLockWithName & { extraInfo: string, virtual: boolean }) => string): string {
    if (this.stateLock.length) {
      let lockWithName = this.stateLock.find(item => element.parametro.key === item.parametro?.key);
      if (lockWithName) {
        let {extraInfo, virtual = false} = lockWithName?.parametro || {extraInfo: '', virtual: false};
        return callback({...lockWithName, extraInfo, virtual});
      }
    }
    return ''
  }

  hasConfronto(item: IParameter) {
    return !item.parametro.key.includes('|');
  }


}
