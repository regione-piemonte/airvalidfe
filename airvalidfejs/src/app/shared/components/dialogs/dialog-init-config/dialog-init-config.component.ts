/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {AfterViewInit, Component, ElementRef, Inject, OnInit, QueryList, ViewChild, ViewChildren,} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators,} from '@angular/forms';
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter,} from '@angular/material-moment-adapter';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE,} from '@angular/material/core';
import {DialogParametersComponent, IFormData, ITypeForm, ToggleGroup,} from '@components/shared/dialogs';
import {MAT_DIALOG_DATA, MatDialogClose, MatDialogRef,} from '@angular/material/dialog';
import moment from 'moment-timezone';
import {MatDatepicker} from '@angular/material/datepicker';
import {Moment} from 'moment';
import {CurrentViewType, MY_FORMATS, TypePeriod} from './models';
import {LanguageService, LocalService} from '@services/core/index';
import {Store} from '@ngrx/store';
import {debounceTime, filter, map, Observable, switchMap, take} from 'rxjs';
import {AppState} from '../../../../state';
import {Router} from '@angular/router';
import {BooleanInput} from '@angular/cdk/coercion';
import {changePeriodoSelector, dialogLavoroSelector} from '@selectors/*';
import {DateSettingService} from '@services/core/utility/date-setting.service';
import {
  addElaborazioneSelectionAction,
  changeLavoroAction, deleteSpecialisticoAction,
  dialogSetPeriodAction,
  initDialogAction,
  IPropsChangeLavoro,
  nextLavoroAction,
  selectedReportisticaAction,
  selectPeriodoReportisticaAction,
  setDBDialogAction,
  setPeriodoElaborazioneAction,
  setPeriodoReportisticaAction,
  setReportToInitReportisticaAction,
} from '@actions/*';
import {TranslateService} from '@ngx-translate/core';
import {MatMenu} from '@angular/material/menu';
import {environment} from '@environments/environment';
import {ITranslate, SelectChoiceRender} from '@models/ITranslate.interface';
import {TypeValueToSpecialistico} from '@state/effects/*';
import {IFormToStandard} from '@components/shared/dialogs/reportistica-standard/model/standard.model';
import {ReportisticaService} from '@services/core/api';

export interface ISpecialistica {
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-dialog-init-config',
  templateUrl: './dialog-init-config.component.html',
  styleUrls: ['./dialog-init-config.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class DialogInitConfigComponent implements OnInit, AfterViewInit {
  @ViewChild('menu') menu!: MatMenu;
  @ViewChildren(MatDialogClose) buttons!: QueryList<ElementRef>;
  currentView: CurrentViewType = 'month';
  date = new FormControl();
  description: string;
  form: FormGroup = this._getForm();
  sliderForm: FormGroup = this._getFormSlider();
  maxDate: Date = this.dateService.addDays(new Date(), 1);

  period: TypePeriod = 'personalizzato';
  selected: Date | null = null;
  showStep2 = false;
  dbToggle: BooleanInput = false;
  tipo$ = this.storeService.select(dialogLavoroSelector);
  changePeriod$ = this.storeService.select(changePeriodoSelector);
  showTypeElaboration = false;
  elaborationChoiceType: Array<ToggleGroup> = [];
  selectedRender: any;
  showTypePeriod: boolean = false;
  environment = environment;
  scelta_render?: SelectChoiceRender[];
  scelta_render_specialistica?: SelectChoiceRender[];
  toggle_group?: SelectChoiceRender[];
  selectedReportistica?: ToggleGroup;
  scelta_render_standard?: SelectChoiceRender[];
  standardForm?: IFormToStandard;
  listServiceToSpecialistica: Array<ISpecialistica> = [];
  formValidSpecialistica: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: { description: string; showStep2?: boolean; path?: string },
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DialogParametersComponent>,
    private readonly localService: LocalService,
    private readonly storeService: Store<AppState>,
    private readonly router: Router,
    private readonly dateService: DateSettingService,
    private readonly _languageService: LanguageService,
    private readonly _translateService: TranslateService,
    private readonly _reportisticaService: ReportisticaService
  ) {
    let { description, showStep2 = false, path } = data;

    this.description = description;
    this.showStep2 = showStep2 || false;
    if (showStep2 && path) {
      this.form.get('lavoro')?.setValue(path);
      this.storeService.dispatch(
        nextLavoroAction({ lavoro: this.form.get('lavoro')?.value })
      );
    }

    this._languageService.currentLanguage$
      .pipe(
        switchMap<string, Observable<ITranslate>>((language) =>
          this._translateService.getTranslation(language)
        )
      )
      .subscribe((res) => {
        this.elaborationChoiceType =
          res.button.group.scelta_elaborazione.toggle_group;
        let {
          scelta_render,
          scelta_render_specialistico,
          scelta_elaborazione,
          scelta_render_standard,
        } = res.button.group;
        let { toggle_group } = scelta_elaborazione;
        this.scelta_render = scelta_render;
        this.scelta_render_specialistica = scelta_render_specialistico;
        this.toggle_group = toggle_group;
        this.scelta_render_standard = scelta_render_standard;
      });
  }

  /**
   * @description Ritorna il valore del periodo selezionato
   */
  get _periodValue(): Record<TypePeriod, CurrentViewType> {
    return {
      personalizzato: 'month',
      mese: 'month',
      anno: 'multi-year',
      giorno: 'month',
    };
  }

  private getServiceToSpecialistica() {
    return this._reportisticaService
      .getListOfElaborazioneSpecialistica()
      .pipe(
        take(1),
        map((lista) => [
          {
            id: 'none',
            name: 'Selezione none',
            description: 'Scegli la specialistica desiderata*',
          },
          ...lista,
        ])
      )
      .subscribe((listOfElaborazione) => {
        this.listServiceToSpecialistica = listOfElaborazione;
      });
  }

  ngOnInit() {
    this.storeService.dispatch(initDialogAction());
  }
  ngAfterViewInit() {
    this.form.valueChanges.pipe(
      debounceTime(500),
      map((value) => ({
        ...value,
        dataInizio: value.startDate,
        dataFine: value.endDate,
      }))
    );

    this.form.get('tipoElaborazione')?.valueChanges.subscribe((value) => {
      if (value === 'specialistica') {
        this.getServiceToSpecialistica();
      } else {
        this.listServiceToSpecialistica = [];
      }
    });
    this.storeService.select(dialogLavoroSelector)
      .pipe(
        filter(value => !!value),
        take(1),
      )
      .subscribe(tipo => {
        if (tipo.includes('reportistica') || tipo.includes('elaborazione')) {
          this.sliderForm.get('dbToggle')?.setValue(true, {emitEvent: false});
          this.storeService.dispatch(setDBDialogAction('reg'))
        }
      })

    // Rimaniamo in ascolto del valore del toggle per cambiare il valore del db
    this.sliderForm.valueChanges.subscribe(({ dbToggle }) =>
      this.storeService.dispatch(setDBDialogAction(!dbToggle ? 'cop' : 'reg'))
    );
  }

  save() {
    let { startDate, endDate, ...value } = this._getFormData();
    // Calcolo la differenza tra prima data e seconda
    let daysDifference = this.dateService.differenceInDays(startDate, endDate);
    // Verifico che il periodo sia superiore a 365 giorni
    let isYearlyPeriod = daysDifference > 365;
    // Verifico che la differenza sia minore o uguale a zero
    let isInvalidDateRange = daysDifference <= 0;

    if (this.period === 'anno' && (isYearlyPeriod || isInvalidDateRange)) {
      startDate = this.dateService.createInitYear(startDate).toJSON();
      endDate = this.dateService.createEndYear(startDate).toJSON();
    }
    if (this.period === 'mese') {
      startDate = this.dateService.createInitMouthPrec(startDate, 0).toJSON();
      endDate = this.dateService.createEndMouthPrec(startDate, 0).toJSON();
    }
    // Verifico che non sia tipo periodo giorno
    if (this.period === 'giorno') {
      startDate = this.dateService.createInitDay(startDate).toJSON();
      endDate = this.dateService.createEndDay(startDate).toJSON();
    }
    let startTimestamp = this.dateService.createTimeStamp(startDate);
    this.localService.setDateStore('dataInizioTime', startTimestamp);
    let endTimestamp = this.dateService.createTimeStamp(
      this.dateService.addDays(new Date(endDate), 1)
    );
    this.localService.setDateStore('dataFineTime', endTimestamp);
    let body: IPropsChangeLavoro = {
      ...value,
      dataInizio: startDate,
      dataFine: endDate,
      dataInizioTime: startTimestamp,
      dataFineTime: endTimestamp,
    };
    this._sendAction(value.lavoro, body);
    // this.storeService.dispatch(changeLavoroAction({...value, dataInizio: startDate, dataFine: endDate, dataInizioTime: startTimestamp, dataFineTime: endTimestamp}))
    this.dialogRef.close(this.form.value);
  }

  isFormValid() {
    const lavoro = this.form.get('lavoro')?.value;
    const tipoElaborazione = this.form.get('tipoElaborazione')?.value;
    const selectedReportistica = this.selectedReportistica;

    if (lavoro === 'elaborazione' && !tipoElaborazione) {
      return false;
    }

    if (lavoro === 'reportistica' && !selectedReportistica) {
      return false;
    }

    if (tipoElaborazione === 'specialistica') {
      return this.formValidSpecialistica;
    }
    return true;
  }

  onFormStatusChange(isValid: boolean) {
    this.formValidSpecialistica = isValid;
  }

  close() {
    this.dialogRef.close();
    this.form.reset();
  }

  next() {
    let { lavoro } = this.form.getRawValue();
    this.storeService.dispatch(nextLavoroAction({ lavoro }));
    this.showStep2 = true;
  }

  tipoElaborazioneValidator(form: FormGroup) {
    const lavoro = form?.get('lavoro')?.value;
    const tipoElaborazione = form.get('tipoElaborazione')?.value;

    if (lavoro === 'elaborazione' && tipoElaborazione === '') {
      return { tipoElaborazioneRequired: true };
    }

    return null;
  }

  tipoGraficoValidator(form: FormGroup) {
    const lavoro = form?.get('lavoro')?.value;
    const tipoGrafico = form.get('tipoGrafico')?.value;

    if (lavoro === 'elaborazione' && tipoGrafico === '') {
      return { tipoGraficoRequired: true };
    }

    return null;
  }

  updateValue(value: ToggleGroup) {
    if (this.selectedRender) {
      this.selectedRender.isSelected = false;
    }
    value.isSelected = true;
    this.selectedRender = value;
    this.form.get('tipoGrafico')!.setValue(this.selectedRender.value);
  }

  setPeriod(event: TypePeriod) {
    this.period = event;
    this._setValue({ startDate: '', endDate: '' });
    this.storeService.dispatch(dialogSetPeriodAction({ periodo: event }));

    switch (event) {
      case 'personalizzato':
        this._setValueByType(event, {
          startDateAmount: this.dateService.createInitDay(
            new Date().toString(),
            5
          ),
          endDateAmount: this.dateService.createEndDay(
            new Date().toString(),
            1
          ),
        });
        break;
      case 'giorno':
        this._setValueByType(event, {
          startDateAmount: this.dateService.createInitDay(
            new Date().toString(),
            1
          ),
          endDateAmount: this.dateService.createEndDay(
            new Date().toString(),
            1
          ),
        });
        break;
      case 'mese':
        this._setValueByType(event, {
          startDateAmount: this.dateService.createInitMouthPrec(),
          endDateAmount: this.dateService.createEndMouthPrec(),
        });
        break;
      case 'anno':
        this._setValueByType(event, {
          startDateAmount: this.dateService.createInitYearPrec(),
          endDateAmount: this.dateService.createEndYearPrec(),
        });
        break;
    }
  }

  /**
   * @description Ricevo il periodo Moment e la data, settiamo il dataform con il moment ricevuto, e chiudo il datepicker
   * @param {Moment} normalizedDate
   * @param {MatDatepicker<Moment>} datepicker
   * @param {'mese' | 'anno'} type - Ricevo il tipo
   * @param {string} validazione -Ricevo il tipo di lavoro
   * @example
   * this._chosenDateHandler(moment(), datepicker)
   * return void
   */
  chosenDateHandler(
    normalizedDate: Moment,
    datepicker: MatDatepicker<Moment>,
    type: 'mese' | 'anno' = 'mese',
    validazione?: string
  ) {
    let periodo: Moment = moment();
    let momentMouth: Moment = periodo.month(normalizedDate.month());
    let momentYear: Moment = periodo.year(normalizedDate.year());

    let value = type === 'mese' ? momentMouth : momentYear;
    this.date.setValue(value);
    let startDate = periodo
      .startOf(type === 'mese' ? 'month' : 'year')
      .format('YYYY-MM-DD');
    let endDate = periodo
      .endOf(type === 'mese' ? 'month' : 'year')
      .format('YYYY-MM-DD');

    this._setValue({ startDate, endDate });
    let multi = this.currentView === 'multi-year';
    let year = this.currentView === 'year';
    if (multi || year || validazione === 'validazione') {
      datepicker.close();
    }
  }

  notValidazione() {
    let lavoro = this.form.get('lavoro')?.value;
    let elaborazioneAndReportistica = lavoro !== 'validazione';
    return this.showStep2 && elaborazioneAndReportistica;
  }

  selectTypeGrafico() {
    /* TODO crea un altro html per la scelta aggiungere il valore al form */
    this.storeService.dispatch(addElaborazioneSelectionAction(this.form.value));
    this.showTypeElaboration = true;
  }

  selectRenderGrafico() {
    let form = this.form.getRawValue();

    if (this.selectedReportistica?.group === 'Standard') {
      this.period =
        this.selectedReportistica.value === 'daily'
          ? 'giorno'
          : this.selectedReportistica.value !== 'daily' &&
            this.selectedReportistica.value !== 'yearly'
          ? 'personalizzato'
          : 'anno';
    }

    let isNotSpecialistica = form.tipoElaborazione !== 'specialistica';
    this.showTypeElaboration = isNotSpecialistica;
    this.selectedRender = isNotSpecialistica;
    this.showTypePeriod = isNotSpecialistica;
    if (form.lavoro === 'elaborazione') {
      isNotSpecialistica
        ? this.storeService.dispatch(addElaborazioneSelectionAction(form))
        : this.dialogRef.close(form);
    }
    if (form.lavoro === 'reportistica') {
      const { value, text } = this.selectedReportistica!;
      this.storeService.dispatch(
        setReportToInitReportisticaAction({
          value: value as TypeValueToSpecialistico,
          text,
        })
      );
    }
  }

  /**
   * @description Ritorna il formGroup
   * @return {FormGroup}
   * @example
   * let form = this._getForm()
   * @Output {lavoro: '', startDate: '', endDate: '' }
   */
  private _getForm(): FormGroup {
    return this.fb.group({
      lavoro: ['', [Validators.required]],
      startDate: [
        this.dateService.createInitDay(new Date().toString(), 5),
        [Validators.required],
      ],
      endDate: [
        this.dateService.createEndDay(new Date().toString(), 1),
        [Validators.required],
      ],
      tipoElaborazione: ['', [this.tipoElaborazioneValidator]],
      tipoGrafico: ['', [this.tipoGraficoValidator]],
    });
  }

  /**
   * Sets the value of the form.
   *
   * @private
   * @template T
   * @param {ITypeForm} value - The new value for the form.
   * @param {T} set - Valore del set Form
   */
  private _setForm<T>(value: ITypeForm, set: T) {
    // @ts-ignore
    this.form.get(value)?.setValue(set);
  }

  getValueToForm<T>(value: ITypeForm): T {
    return this.form.get(value)?.value;
  }

  private _getFormSlider() {
    return this.fb.group({
      dbToggle: [false, [Validators.required]],
    });
  }

  /**
   * @description Set value form startDate and endDate
   * return void
   * @example
   * this._setValue({startDate: '2021-01-01', endDate: '2021-01-31'})
   * this._setValue({startDate: moment(), endDate: moment()})
   */
  private _setValue({startDate, endDate}: {
    startDate?: string | Date;
    endDate?: string | Date;
  }): void {
    this.setDateRange(startDate, endDate);

    let lavoro = this._getFormData().lavoro;
    let isReportistica = lavoro === 'reportistica';
    let isValidazione = lavoro === 'validazione';
    const body: { dataInizio: string; dataFine: string } = {
      dataInizio:
        typeof startDate === 'string'
          ? startDate
          : this.dateService.formatDate(startDate!),
      dataFine:
        typeof endDate === 'string'
          ? endDate
          : this.dateService.formatDate(endDate!),
    };
    if (isReportistica) {
      this.storeService.dispatch(setPeriodoReportisticaAction({ ...body }));
    } else if (isValidazione) {
      // this.storeService.dispatch(selectPeriodAction({...body}));
    }
  }

  private setDateRange(startDate?: string | Date, endDate?: string | Date) {
    if (this.period === 'personalizzato') {
      this._setForm('startDate', startDate);
      this._setForm('endDate', endDate);
    } else {
      this._setForm('startDate', startDate);
      this._setForm('endDate', endDate);
    }
  }

  /**
   * @description Set value form days, months, years
   * return void
   * @example
   * this._setValueByType('days')
   * this._setValueByType('months')
   * this._setValueByType('years')
   */
  private _setValueByType(type: TypePeriod, {startDateAmount, endDateAmount}: {
      startDateAmount?: Date;
      endDateAmount?: Date;
    }): void {
    this.currentView = this._periodValue[type];
    this._setValue({ startDate: startDateAmount, endDate: endDateAmount });
  }

  /**
   * Retrieves the form data.
   *
   * @returns {IFormData} The form data obtained from the current form.
   * @example
   * let data = this._getFormData();
   * @output
   * {
   *   lavoro: 'reportistica',
   *   startDate: 'data'
   *   endDate: 'data'
   * }
   */
  private _getFormData(): IFormData {
    return this.form.getRawValue();
  }

  private _sendAction(value: string, body: IPropsChangeLavoro): void {
    switch (value) {
      case 'validazione':
        this.storeService.dispatch(changeLavoroAction({ ...body }));
        break;
      case 'reportistica':
        if (this.standardForm?.controlTime === 'daily') {
          // Elimino la data fine del body
          body = {
            ...body,
            dataFine: '',
            dataFineTime: undefined,
          };
        }
        this.storeService.dispatch(
          selectPeriodoReportisticaAction({
            ...body,
            standard: this.standardForm,
          })
        );
        break;
      case 'elaborazione':
        this.storeService.dispatch(
          setPeriodoElaborazioneAction({
            endDate: body.dataFineTime!,
            startDate: body.dataInizioTime!,
            tipoElaborazione: body.tipoElaborazione!,
            tipoGrafico: '',
            lavoro: body.lavoro!,
          })
        );
        break;
      default:
        this.storeService.dispatch(changeLavoroAction({ ...body }));
        break;
    }
  }

  selectReportistica(selected: ToggleGroup) {
    this.selectedReportistica = selected;
    this.storeService.dispatch(selectedReportisticaAction(selected));
    if (selected.group === 'Standard' && selected.value === 'daily') {
      this.period = 'giorno';
    }
  }

  selectedElaborazione(selected: ToggleGroup) {
    this.selectedReportistica = undefined;
  }

  getCurentView(): CurrentViewType {
    switch (this.period) {
      case 'personalizzato':
      case 'giorno':
        return 'month';
      case 'mese':
        return 'year';
      case 'anno':
        return 'multi-year';
    }
  }

  changeType() {
    this.sliderForm.enable();
    this.storeService.dispatch(deleteSpecialisticoAction())
  }
}
