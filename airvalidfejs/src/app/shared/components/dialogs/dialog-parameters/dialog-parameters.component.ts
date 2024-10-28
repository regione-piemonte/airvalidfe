/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {AfterViewInit, Component, Inject, OnInit, QueryList, ViewChildren} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators,} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {combineLatest, debounceTime, filter, forkJoin, iif, map, Observable, of, pairwise, Subject, switchMap, withLatestFrom} from 'rxjs';
import {finalize, groupBy, mergeAll, mergeMap, reduce, startWith, take, tap, toArray} from 'rxjs/operators';
import {BooleanInput} from '@angular/cdk/coercion';
import {IDettaglioConfigParam, NetworkName, SensorName, StationName} from '@models/response/dettaglio-config-param';
import {MatTabChangeEvent} from '@angular/material/tabs';
import {DataService, UserSettingService} from '@services/core/index';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../state';
import {NetworksService, SensorsService, SettingsService, StationsService, UserStateLock} from '@services/core/api';
import {AreeTerritoriali, IData, Parametri} from "@models/validazione";
import {MatCheckboxChange} from '@angular/material/checkbox'
import {NgxSpinnerService} from 'ngx-spinner'
import {addParameterAction, initDialogParameterAction} from "@actions/*";
import {Router} from "@angular/router";
import {IResponseSuggest, RicercaSuggestService} from "@services/core/api/suggest/ricerca-suggest.service";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {MatChipInputEvent} from "@angular/material/chips";
import {dbElaborazioneSelector, dbReportisticaSelector} from "@selectors/*";
import {MatInput} from "@angular/material/input";

type IPropsRicerca = IData & { suggest?: string[] };

export interface IPropsFilter {
  publicManagement: boolean;
  national: boolean;
  mobile: boolean;
  publicView: boolean;
}

type ITypeFormKeys = 'stationName' | 'parameterName' | 'dbToggle' | 'publicManagement' | 'national' | 'mobile' | 'publicView';

interface GenerateDialogParametersParams {
  stationName: StationName[];
  list: { sensorName: SensorName[]; networkName: NetworkName; stationName: StationName[] }[];
  sensorName: SensorName[];
  networkName: NetworkName;
}

@Component({
  selector: 'app-dialog-parameters',
  templateUrl: './dialog-parameters.component.html',
  styleUrls: ['./dialog-parameters.component.scss'],
})
export class DialogParametersComponent implements OnInit, AfterViewInit {
  result = ''
  form = this._createForm();
  formPreset = this._createFormPreset();
  formConfPreset = this._createFormConfPreset();
  formAdvancedSuggest = this._createFormAdvancedSuggest();
  description: string;
  parametroScelto?: AreeTerritoriali;
  defaultRete$ = this._userSettingService.setting$;
  listaAreeTerritoriali$ = this.getListaNetwork();
  listStazioni$: Observable<StationName[]> = new Subject<Array<StationName>>();
  listParametri$: Observable<Parametri[]> = new Observable<Parametri[]>();
  listParametriCompleta: Array<Parametri> = [];
  presetCheck: BooleanInput = false;
  savePresetExpansion: Boolean = false;
  selectPreset: Array<any> = [
    {
      name: 'Preset 1',
      retiTerritoriali: [
        "RETE QUALITA' ARIA PROV. ASTI",
        "RETE QUALITA' ARIA PROV. CUNEO",
        "RETE QUALITA' ARIA PROV. TORINO",
      ],
      stazioniTerritoriali: [
        'Asti - Baussano',
        'Torino - Collegno',
        'Cuneo - Alpini',
      ],
      parametriTerritoriali: ['Biossido di azoto (NO2)'],
    },
    {
      name: 'Preset 2',
      retiTerritoriali: ["RETE QUALITA' ARIA PROV. ASTI"],
      stazioniTerritoriali: ['Asti - Baussano'],
      parametriTerritoriali: ['Biossido di azoto (NO2)'],
    },
  ];

  response: Array<any> = [];
  listSensori?: IDettaglioConfigParam[];
  private listaArea: Array<AreeTerritoriali> = [];
  private elementoSelezionato: Array<AreeTerritoriali> = [];

  options: string[] = ['Stazione 1', 'Stazione 2', 'Stazione 3', 'Stazione 4'];
  filterStationdOptions: IResponseSuggest[] = [];
  filterParameterdOptions: IResponseSuggest[] = [];
  selectedStations: IResponseSuggest[] = [];
  selectedParameters: IResponseSuggest[] = [];
  removable: boolean = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  // La url dove ci troviamo
  currentUrl: string = this.router.url;

  @ViewChildren(MatInput) inputs?: QueryList<MatInput>;
  private currentDb?: UserStateLock;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { description: string },
    private fb: FormBuilder,
    private networkService: NetworksService,
    private stationsService: StationsService,
    private dialogRef: MatDialogRef<DialogParametersComponent>,
    private settingService: SettingsService,
    private sensorService: SensorsService,
    private readonly dataService: DataService,
    private storeService: Store<AppState>,
    private readonly _userSettingService: UserSettingService,
    private _spinnerService: NgxSpinnerService,
    private readonly router: Router,
    private readonly suggest: RicercaSuggestService,
  ) {
    this.description = data.description;
    this.formAdvancedSuggest.disable({emitEvent: false});
    this.defaultRete$.pipe(
      take(1),
    ).subscribe((value) => {
      if (value && value.areeTerritoriali) {
        this.parametroScelto = value.areeTerritoriali;
      }
    });
  }


  private getListaNetwork() {

    if (this.router.url.includes('reportistica')) {
      return this.storeService.select(dbReportisticaSelector).pipe(
        take(1),
        switchMap(db => this.networkService.getNetworksName(db)),
      )
    }
    if (this.router.url.includes('elaborazione')) {
      return this.storeService.select(dbElaborazioneSelector).pipe(
        take(1),
        switchMap(db => this.networkService.getNetworksName(db)),
      )
    }

    return this.networkService.getNetworksName();

  }

  private getDBToUrl() {
    return iif(() => this.router.url.includes('reportistica'),
      this.storeService.select(dbReportisticaSelector).pipe(take(1)),
      iif(() => this.router.url.includes('elaborazione'),
        this.storeService.select(dbElaborazioneSelector),
        of<UserStateLock>('cop')
      )
    )
  }

  /**
   * Create a new form group with three form controls: areeTerritoriali, stazioni, and parametri.
   *
   * @private
   * @returns {FormGroup} - The created form group.
   * @example
   * this._createForm();
   * output: {
   *   areeTerritoriali: '',
   *   stazioni: '',
   *   parametri: '',
   * }
   */
  private _createForm(): FormGroup {
    return this.fb.group({
      areeTerritoriali: ['', [Validators.required]],
      stazioni: ['', [Validators.required]],
      parametri: ['', [Validators.required]],
    });
  }

  /**
   * Creates a form preset using the FormBuilder service.
   *
   * @returns {FormGroup} The created form preset.
   * @example
   * this._createFormPreset();
   * output: {
   *    presetParams: '',
   * }
   */
  private _createFormPreset(): FormGroup {
    return this.fb.group({
      presetParams: ['', [Validators.required]],
    });
  }

  /**
   * Creates a form group for configuring a preset.
   *
   * @returns {FormGroup} The form group for configuring a preset.
   */
  private _createFormConfPreset(): FormGroup {
    return this.fb.group({
      nameConfPreset: ['', [Validators.required, Validators.pattern(/^(?=.*[a-zA-Z0-9])[a-zA-Z0-9_ ]+$/)]],
    });
  }


  /**
   * Creates a form group for configuring a preset.
   *
   * @returns {FormGroup} The form group for configuring a preset.
   */
  private _createFormAdvancedSuggest(): FormGroup {
    return this.fb.group({
      dbToggle: ['', Validators.required],
      publicManagement: [true],
      national: [],
      mobile: [false],
      publicView: [],
      stationName: ['', Validators.required],
      parameterName: ['', Validators.required]
    });
  }

  /**
   * Recupera i criteri di filtro dal modulo.
   *
   * @return {Partial<IPropsFilter>} Un oggetto contenente proprietà di filtro come
   * `publicManagement`, `national`, `mobile` e `publicView`.
   */
  private getFiltri(): Partial<IPropsFilter> {
    let {publicManagement, national, mobile, publicView} = this.formAdvancedSuggest.value;
    return {
      publicManagement,
      national,
      mobile,
      publicView
    }
  }

  /**
   * Ascolta i cambiamenti in più controlli di form e applica i filtri rispettivi.
   *
   * Questo metodo combina i cambiamenti di valore dei controlli di form specificati e
   * attiva un'azione quando vengono soddisfatte determinate condizioni. In particolare,
   * verifica se i controlli del form `parameterName` o `stationName` sono stati toccati.
   * Quando le condizioni sono soddisfatte, reimposta i parametri e le stazioni selezionati,
   * modifica le opzioni del filtro e aggiorna i valori del form.
   *
   * @return {void} No return value.
   */
  private _listenChangeFilter(): void {
    combineLatest([
      this.getFormValue('mobile').valueChanges.pipe(startWith(undefined)),
      this.getFormValue('dbToggle').valueChanges.pipe(startWith(undefined)),
      this.getFormValue('publicManagement').valueChanges.pipe(startWith(undefined)),
      this.getFormValue('national').valueChanges.pipe(startWith(undefined)),
      this.getFormValue('publicView').valueChanges.pipe(startWith(undefined)),
    ])
      .pipe(
        filter(value => this.getFormValue('parameterName').touched || this.getFormValue('stationName').touched),
        map(([mobile, db, pManagement, national, view]) => ({mobile, db, pManagement, national, view}))
      )
      .subscribe({
        next: ({mobile, db, pManagement, national, view}) => {

          // Elimino la lista del parametri selezionati
          this.selectedParameters = [];
          // Elimino la lista delle stazioni selezionate
          this.selectedStations = [];
          // Modifico anche la lista della ricerca
          this.filterStationdOptions = [];
          this.filterParameterdOptions = [];
          // Setto il valore del form
          this.form.patchValue({
            stationName: '',
            parameterName: '',
          }, {emitEvent: false});
          this.getFormValue('stationName').markAsUntouched();
          this.getFormValue('parameterName').markAsUntouched();
        },
        error: err => {
          // Logica per l'errore
        },
        complete: () => {
          // Logica per il complete
        }
      })
  }

  /**
   * Prende la url su qui si apre il modal e restituisce il `db` selezionato
   *
   * @return {Observable<string>} An Observable that emits a string based on the current URL.
   */
  private _readUrl(): Observable<UserStateLock> {
    if (this.currentUrl.includes('reportistica')) {
      return this.storeService.select(dbReportisticaSelector);
    }
    if (this.currentUrl.includes('elaborazione')) {
      return this.storeService.select(dbElaborazioneSelector);
    }
    return of('cop');
  }

  private _listeChangeDb() {

    this._readUrl().subscribe(db => {
      this.currentDb = db;
      switch (db) {
        case "cop":
          this.getFormValue('mobile').disable()
          this.getFormValue('national').disable()
          this.getFormValue('publicView').disable()
          break;
        case "reg":
          this.getFormValue('mobile').enable()
          this.getFormValue('national').enable()
          this.getFormValue('publicView').enable()
          break;
      }

    });
  }


  /**
   * Carica i parametri osservando le modifiche nel controllo del modulo per `parameterName` e recuperando
   * suggerimenti basati sul valore corrente, sulle stazioni selezionate e sui filtri che sono gli ids delle `selectedStations`
   * selezionate.
   *
   * @return {void} No return value.
   */
  private _loadParameters(): void {
    this.getFormValue('parameterName').valueChanges
      .pipe(
        debounceTime(500),
        filter(value => typeof value === 'string'),
        withLatestFrom(this._readUrl()),
        switchMap(([par, db]) => this._getObservableParameters(par, db))
      )
      .subscribe({
        next: (parametri) => {
          console.info(parametri);
          this.filterParameterdOptions = parametri;
        },
        error: (error) => {
        }
      })
  }

  private _getObservableParameters(parameter: string, db: UserStateLock): Observable<Array<IResponseSuggest>> {
    return this.suggest.getParamiters(parameter, {
      db,
      filtri: this.getFiltri(),
      stationIds: this.selectedStations.map(item => item.key),
    })
  }

  /**
   * Carica i valori delle stazioni in base la valore del `stationName` inserito ed alla lista dei id params nella
   * lista `selectedParameters`
   *
   * @return {void} Does not return a value.
   */
  private _loadStation(): void {
    this.getFormValue('stationName').valueChanges
      .pipe(
        debounceTime(500),
        filter(item => typeof item === 'string'),
        withLatestFrom(this._readUrl()),
        switchMap(([stazione, db]) => this._getObservableStations(stazione, db))
      )
      .subscribe({
        next: (stations) => {
          console.log(stations, 'Stazioni');
          this.filterStationdOptions = stations;
        },
        error: error => console.error(error)
      })
  }

  private _getObservableStations(stazione: string, db: UserStateLock): Observable<Array<IResponseSuggest>> {
    return this.suggest.getStations(stazione, {
      db,
      filtri: this.getFiltri(),
      parameterIds: this.selectedParameters.map(item => item.key),
    })
  }

  private _formatValue(value: IDettaglioConfigParam[]) {
    let uniqueStation: StationName[] = [];
    let uniqueStationKeys = new Set([...value.map(sta => sta.stationName.key)]);
    let mapStation = value.map(item => item.stationName);
    uniqueStationKeys.forEach(key => {
      let selectedStation = mapStation.find(station => station.key === key);
      if (selectedStation) {
        uniqueStation.push(selectedStation);
      }
    });

    return {
      sensorName: value.map(item => item.sensorName),
      stationName: uniqueStation,
      networkName: value[0].networkName
    }
  }

  private _refactoringResponse(observable: Observable<IDettaglioConfigParam[]>) {
    return (observable).pipe(
      switchMap(lista => lista),
      groupBy(({stationName, networkName}) => networkName.key),
      mergeMap(group => group.pipe(toArray())),
      map(resp => this._formatValue(resp)),
      toArray(),
      finalize(() => this._spinnerService.hide('global'))
    )
  }

  private _getSensorDetailsFromSuggestions(suggest: string[]) {
    // Creo gli observer per la ricerca di suggest
    let map1 = forkJoin(suggest.map(key => this.sensorService.getSensorDetail(key)));
    map1
      .pipe(value => this._refactoringResponse(value))
      .subscribe({
        next: ([{stationName, networkName, sensorName}, ...list]) => {
          // console.info({sensorName, networkName, stationName}, 'Response dopo la creazione');
          const propsState = this.generateDialogParameters({stationName, list, sensorName, networkName})
          this.storeService.dispatch(addParameterAction({parameters: propsState}));
          this.dialogRef.close({...propsState});
        },
        error: err => console.info(err),
        complete: () => console.info('Saving data'),
      })
  }


  private generateDialogParameters({stationName, list, sensorName, networkName}: GenerateDialogParametersParams): IData {
    return {
      all: [],
      selected: {
        stazioni: [...stationName, ...list.map(item => item.stationName).flat()],
        parametri: [...sensorName.map(item => ({...item, correctionSupported: true})), ...list.map(item => ([...item.sensorName.map(senr => ({...senr, correctionSupported: true}))])).flat()],
        areeTerritoriali: [networkName, ...list.map(item => item.networkName).flat()],
      }
    };
  }

  ngOnInit() {
    this.storeService.dispatch(initDialogParameterAction());
    this._listenChangeFilter();
    this._loadStation();
    this._loadParameters();
    this.onChanges();
  }


  /**
   * Restituisce il FormControl che contiene il `formAdvancedSuggest`
   * attraverso la key passata come parametro
   * @param {ITypeFormKeys} value -Valore del key form
   */
  getFormValue(value: ITypeFormKeys): FormControl {
    return this.formAdvancedSuggest.get(value)! as FormControl;
  }

  isEqual(objA: AreeTerritoriali, objB?: AreeTerritoriali): boolean {
    if (!objB) {
      return false;
    }
    return objA && objB && objA.key === objB.key && objA.name === objB.name;
  }


  onTabChange(event: MatTabChangeEvent) {
    if (event.index === 1) { // Verifica se il tab attivo è quello del preset (indice 0)
      this.presetCheck = true;
      this.changePreset();
      this.unlockBtn();
    } else {
      this.presetCheck = false;
      this.changePreset();
    }

    let advancedTabSelected = event.tab.textLabel.toLowerCase().includes('avanzato');
    if (advancedTabSelected) {
      this.form.disable();
      this.formAdvancedSuggest.enable({emitEvent: false});
      this._listeChangeDb();
    } else {
      this.form.enable();
      this.formAdvancedSuggest.disable({emitEvent: false});
      this.getFormValue('dbToggle').setValue(false);
    }

  }

  /**
   * Aggiunge un'opzione ai parametri selezionati o alle stazioni selezionate in base al tipo specificato.
   * Se l'opzione viene aggiunta, sarà rimossa dall'elenco delle opzioni filtrate.
   * Inoltre, recupera e aggiorna i dati correlati di conseguenza.
   *
   * @param {IResponseSuggest} option - L'opzione da aggiungere.
   * @param {'parametro' | 'stazione'} tipo - Il tipo di opzione, può essere 'parametro' per i parametri o 'stazione' per le stazioni.
   * @return {void}
   */
  addOption(option: IResponseSuggest, tipo: 'parametro' | 'stazione'): void {
    // Controlla se l'opzione è valida e fa parte delle opzioni filtrate
    console.info(option);

    // this.inputs?.map(input => input.empty ? input : input.value = '');

    if (tipo === 'parametro') {
      // Prima devo verifica che non sia presente
      if (!this.selectedParameters.some(par => par.key === option.key)) {
        // Inserisco il nuovo parametro
        this.selectedParameters.push(option);
      }

    }
    if (tipo === 'stazione') {
      // Verifico che il nuovo non esista
      if (!this.selectedStations.some(station => station.key === option.key)) {
        // Inserisco il nuovo oggetto
        this.selectedStations.push(option);
      }
    }
    this.inputs?.map(input => input.empty ? input : input.value = '');

  }

  /**
   * Rimuove un'opzione dai parametri selezionati o dalle stazioni selezionate.
   *
   * @param {IResponseSuggest} option - L'opzione da rimuovere.
   * @param {'parametro' | 'stazione'} tipo - Il tipo dell'opzione, può essere 'parametro' per i parametri o 'stazione' per le stazioni.
   * @return {void}
   */
  removeOption(option: IResponseSuggest, tipo: 'parametro' | 'stazione'): void {
    // this.inputs?.map(input => input.empty ? input : input.value);
    if (tipo === 'parametro') {
      this.selectedParameters = this.selectedParameters.filter(param => param.key !== option.key);
    }
    if (tipo === 'stazione') {
      this.selectedStations = this.selectedStations.filter(item => item.key !== option.key);
    }
  }

  ngAfterViewInit() {
    this.listaAreeTerritoriali$.pipe(take(1)).subscribe((value) => {
      // Salvo la lista per chiamarla dopo
      this._spinnerService.show('global');
      const elementoSelezionato = value.find((option) => this.isEqual(option, this.parametroScelto));
      if (elementoSelezionato) {
        this.elementoSelezionato = [elementoSelezionato];
      }
      this.form.patchValue(this.elementoSelezionato ? {areeTerritoriali: this.elementoSelezionato} : {areeTerritoriali: []});
      this._spinnerService.hide('global');
    })

    this.formPreset.get('presetParams')?.valueChanges
      .pipe(
        filter((value) => !!value),
        switchMap((value) => {
          this.form.reset();
          return this.settingService.getDetPreference(value).pipe(
            mergeMap(({listSensorId}) => forkJoin([...listSensorId.map((id) => this.sensorService.getSensorDetail(id))]))
          )
        }))
      .subscribe((value) => {
        // console.info(value);

        this.listSensori = value;
        let {networkNames, sensorNamesList, sensorNames, stationNames} = this.dataService.createData(value);
        this.form.setValue({
          areeTerritoriali: this.dataService.getUniqueList(networkNames, 'key'),
          stazioni: this.dataService.getUniqueList(stationNames, 'key'),
          parametri: this.dataService.getUniqueList(sensorNamesList, 'key'),
        })
        this.listParametriCompleta = sensorNames;
      });


  }

  onChanges(): void {
    this._getStationsByTerritory();
    this._getStationParameters();
    this._handleParametriChange();
    // this._getStationParameterSuggest();
  }

  /**
   * Handles changes in the 'parametri' form control value.
   *
   * @private
   * @returns {void}
   */
  private _handleParametriChange(): void {
    this.form.get('parametri')!.valueChanges
      .pipe(
        switchMap(value => this.listParametri$.pipe(
          map(lista => ({parametri: value, lista}))
        )),
      )
    // .subscribe(({lista, parametri}) => console.info('value selezionato', {parametri, lista}));
  }

  /**
   * Handles changes in the 'parametri' form control value.
   *
   * @private
   * @returns {void}
   */
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    if (filterValue.length >= 3) {
      return this.options.filter(option => option.toLowerCase().includes(filterValue));
    }
    return [];
  }

  /**
   * Private method to retrieve station parameters.
   *
   * @private
   * @returns {void}
   */
  private _getStationParameters(): void {
    this.form.get('stazioni')!.valueChanges.pipe(
      startWith([]),
      pairwise<StationName[]>(),
      filter(([prev, next]) => !!next && next?.length > 0),
      withLatestFrom(this.getDBToUrl()),
      map(([[prev, stazioni], db]) => ({prev, stazioni, db}))
    ).subscribe(({prev, db, stazioni}) => {
      const arrayStation = stazioni.map(({key}) => this.stationsService.getSensorsNameByStation(key, db));

      this.listParametri$ = forkJoin(arrayStation).pipe(
        map((data) => data.reduce((result, arr) => [...result, ...arr], [])),
        map((el) => el.sort(({name}, {name: nameSecondo}) => (name < nameSecondo ? -1 : 1))),
        tap((el) => this.listParametriCompleta = [...el]),
        mergeAll(),
        groupBy(({name}) => name),
        mergeMap((grp$) => grp$.pipe(
          reduce((acc, crt) => (crt.name > acc.name ? crt : acc)),
          // tap((el) => console.info('el', el)),
        )),
        // .pipe( reduce((acc, crt) => (crt.tsUpdate > acc.tsUpdate ? crt : acc)))
        // tap((el) => console.info('el', el)),
        toArray(),
        // tap((listaParametri) => console.debug('lista parametri', listaParametri)),
      );
    });
  }

  /**
   * Private method to fetch stations by territory.
   *
   * @private
   *
   * @returns {void}
   */
  private _getStationsByTerritory(): void {
    this.form.get('areeTerritoriali')!.valueChanges.pipe(
      startWith([]),
      pairwise<StationName[]>(),
      filter(([prev, next]) => !!next && next.filter(item => !!item)?.length > 0),
      withLatestFrom(this.getDBToUrl()),
      map(([[prev, aree], db]) => ({prev, aree, db}))
    )
      .subscribe(({db, aree, prev}) => {
        const arrayAree = aree.map(({key}) => this.networkService.getStationsNameByNetwork(key, db));

        this.listStazioni$ = this.networkService.generaListStazioni(arrayAree);
      });
  }

  /**
   * Creates a body to save data.
   *
   * @private
   * @return {IPropsRicerca} The created body to save.
   */
  private _createBodyToSave(): IPropsRicerca {

    if (this.formAdvancedSuggest.enabled) {
      return {
        all: [],
        selected: {
          parametri: [],
          stazioni: [],
          areeTerritoriali: [],
          status: undefined
        },
        suggest: this.selectedStations.map(({key: stationKey}) => this.selectedParameters.map(({key: parKey}) => `${stationKey}.${parKey}`)).flat()
      }
    }
    return {
      selected: this.form.value,
      all: this.listParametriCompleta,
      suggest: undefined
    };

  }

  /**
   * Retrieves the list of sensor IDs based on the given data.
   *
   * @private
   * @param {IData} result - The data object containing the parameters and sensor information.
   * @returns {Array} - The list of sensor IDs.
   */
  private _getListSensorId(result: IData): Array<string> {
    return result.selected.parametri.map(({name: nameParametro}) => result.all.filter(({name}) => name === nameParametro).map(({key}) => key)).reduce((acc, crt) => [...acc, ...crt], []);
  }

  /**
   * Saves the data by creating a body to save, dispatching it to the store service, and closing the dialog.
   */
  save(): void {
    let {all, selected, suggest} = this._createBodyToSave();
    // Nel caso che fossimo in validazione e non ci sia il suggest
    const isValidationRoute = this.currentUrl.includes('validazione');
    const caseType = `${isValidationRoute ? 'validationRoute' : 'no-validationRoute'}_${suggest ? 'with-suggest' : 'no-suggest'}`;

    const handleSaveWithoutSuggest = () => {
      this.storeService.dispatch(addParameterAction({parameters: {all, selected}}));
      this.dialogRef.close({all, selected});
    }

    const handleSaveWithSuggest = () => {
      this._spinnerService.show('global');
      this._getSensorDetailsFromSuggestions(suggest!);
    }

    switch (caseType) {
      case 'validationRoute_no-suggest':
        handleSaveWithoutSuggest();
        break;
      case 'validationRoute_with-suggest':
      case 'no-validationRoute_with-suggest':
        handleSaveWithSuggest();
        break;
      case 'no-validationRoute_no-suggest':
        this.dialogRef.close({all, selected});
        break;
      default:
        throw new Error(`$type ${caseType} caso non gestito`);
    }
  }


  /**
   * Closes the dialog.
   *
   * @function
   * @returns {void}
   */
  close(): void {
    this.dialogRef.close();
  }

  changePreset() {
    this.result = ''
    if (this.presetCheck) {
      this.settingService.getConfigList().subscribe((res) => {
        this.selectPreset = res;
        this.formPreset.reset();
        this.form.reset()
      });

    } else {
      this.formConfPreset.reset();
      this.form.reset();
      if (this.elementoSelezionato) {
        this.form.patchValue({areeTerritoriali: this.elementoSelezionato})
      }
    }
  }

  unlockBtn() {
    if (!this.presetCheck) {
      if (!this.form.valid) {
        return true;
      } else {
        return this.savePresetExpansion && !this.formConfPreset.valid;
      }
    } else {
      return this.form.valid;
    }
  }

  selectAll(event: MatCheckboxChange, param: string, arraySelect: Array<Object> = []) {
    this.form.get(param)?.setValue((event.checked) ? [...arraySelect] : null);
  }

  saveConfig() {
    console.info('in attesa');

    let result = this._createBodyToSave();
    let listSensorId = this._getListSensorId(result);

    console.info('result', result);

    const nameConfPreset: string = this.formConfPreset.get('nameConfPreset')?.value;

    this.settingService.setConfigSensorsList(listSensorId, nameConfPreset).subscribe({
      next: (res) => {
        this.result = "Salvataggio avvenuto con successo";
        this.formConfPreset.get('nameConfPreset')?.setValue('')
      },
      error: (err) => {
        this.result = "Errore nel salvataggio"
      },
      complete: () => {
      }
    })
  }

  addToken(evento: MatChipInputEvent) {
    console.info(evento, 'Evento del add')
  }

  focusInParameter(event: FocusEvent, parametro: 'parametro' | 'stazione') {
    event.preventDefault();
    event.stopPropagation();
    if (parametro === 'parametro') {
      // Pulisco la lista delle stazioni
      this.filterStationdOptions = [];
      this.getFormValue('parameterName').setValue('');
    } else if (parametro === 'stazione') {
      // Pulisco la lista dei parametri
      this.filterParameterdOptions = [];
      this.getFormValue('stationName').setValue('');
    }
  }
}
