import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {EMPTY, map, Observable, of, tap} from 'rxjs';
import {
  idReportAndTime,
  networkSelectorElaborazione,
  parametriSpecialisticiElaborazioneSelector,
  sensorSelectorElaborazione,
  stationSelectorElaborazione,
} from '../../../../../state/selectors/elaborazione-specialistica.selectors';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../../state';
import {AbstractControl, AsyncValidatorFn, FormBuilder, FormControl, FormGroupDirective, NgForm, ValidatorFn, Validators,} from '@angular/forms';
import {Item} from '@services/core/api/reportistica/models/getResponseItem.model';
import {ISpecialistica} from '@dialog/*';
import {
  saveYearsToSpecialisticoElaborazioneAction,
  selectedDateElaborazioneAction,
  selectParametersSpecialisticaElaborazione,
  selectReportSpecialisticoElaborazioneAction,
  selectReteSpecialisticaElaborazioneAction,
  selectSensorsSpecialisticaElaborazioneAction,
  selectStazioneSpecialisticaElaborazioneAction,
} from '@actions/*';
import {MatDatepicker, MatDatepickerInputEvent,} from '@angular/material/datepicker';
import {Moment} from 'moment/moment';
import {ItemSearchType, ReportisticaService, UserStateLock} from '@services/core/api';
import {IDateToService} from '@reducers/*';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {format} from "date-fns";
import {TimePeriod} from "@services/core/api/reportistica/models/getResponseAnagrafh.model";
import {ErrorStateMatcher} from "@angular/material/core";

export interface IFormYears {
  firstYearValue: Date;
  secondYearValue: Date;
  firstYearValueString: string;
  secondYearValueString: string;
}

function valoreMassimoDataOdierna(): AsyncValidatorFn {
  return (control: AbstractControl) => {
    console.info(control?.value, 'Valore data');
    if (control?.value) {
      let controlValue: Moment = control.value;
      return controlValue.valueOf() > Date.now() ? of({dataOdierna: true}) : of(null);
    }
    return EMPTY;
  }
}

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

interface IOnFieldChangeParams {
  min?: number;
  max?: number;
  complete: boolean;
  items?: Item[];
}

interface IYearsProps {
  datapicker: MatDatepicker<Date>;
  annoSelected?: 'primo' | 'secondoAnno';
  timeState: IStateSpecialistico
}

interface IStateSpecialistico {
  id?: string;
  time?: TimePeriod;
  anni?: IFormYears;
  date?: IDateToService;
  db: UserStateLock;
}

@Component({
  selector: 'app-specialistico-form',
  templateUrl: './specialistico-form.component.html',
  styleUrls: ['./specialistico-form.component.scss'],
})
export class SpecialisticoFormComponent implements OnInit {
  timePeriod?: string;
  reportSpecialistico: FormControl = new FormControl('none', {
    validators: Validators.required,
  });
  firstYear: FormControl = new FormControl(undefined, Validators.required, [valoreMassimoDataOdierna()]);
  secondYear: FormControl = new FormControl(undefined, Validators.required,[valoreMassimoDataOdierna()]);
  firstDate: FormControl = this.fb.control(undefined, [Validators.required], [valoreMassimoDataOdierna()]);
  lastDate: FormControl = this.fb.control(undefined, [Validators.required], [valoreMassimoDataOdierna()]);

  @Output() formStatusSpecialistica = new EventEmitter<boolean>();

  networks?: Item[];

  matcher = new MyErrorStateMatcher();

  keysControl = this.fb.control('', [Validators.required]);
  keyStationControl = this.fb.control('', [Validators.required]);
  keyParametersControl = this.fb.control('', [Validators.required]);
  keySensorsControl = this.fb.control('', [Validators.required]);

  // Selettore dello store per specialistico
  specialisticoStore$: Observable<IStateSpecialistico> = this.storeService
    .select(idReportAndTime)
    .pipe(tap((res) => console.log(res, 'Init Component')));

  // Selettore dei network
  networkSelector$ = this.storeService.select(networkSelectorElaborazione).pipe(
    tap((res) => console.log(res, 'Init Component')),
    map((response) => ({
      item: response?.items,
      complete: response?.selectionCompleted,
    }))
  );

  // Selettore delle station
  stationSelecto$ = this.storeService.select(stationSelectorElaborazione).pipe(
    tap((res) => console.log(res, 'Init Component')),
    map((response) => ({
      items: response?.items || [],
      complete: response?.selectionCompleted || false,
      min: response?.countMin || 0,
      max: response?.countMax || 0
    }))
  );

  parametriSelector$ = this.storeService
    .select(parametriSpecialisticiElaborazioneSelector)
    .pipe(
      map((response) => ({
        items: response?.items,
        complete: response?.selectionCompleted,
      }))
    );

  // Selettore dei parametri
  sensoriSelector$ = this.storeService.select(sensorSelectorElaborazione).pipe(
    tap((res) => console.log(res, 'Init Component')),
    map((response) => ({
      items: response?.itemsKeys || [],
      complete: response?.selectionCompleted || false,
      min: response?.countMin || 0,
      max: response?.countMax || 0
    }))
  );

  @Input() listServiceToSpecialistica!: Array<ISpecialistica>;
  @Output() lockDb: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private readonly storeService: Store<AppState>,
    private readonly fb: FormBuilder,
    private readonly _reportisticaService: ReportisticaService
  ) {
  }

  /**
   * Retrieves the selected years from the form.
   *
   * @return {IFormYears} An object containing the first and second year values as Date objects,
   *                      along with their corresponding year strings.
   */
  private getSelectedYears(): IFormYears {
    let firstYearValue: Date = this.firstYear.value;
    let secondYearValue: Date = this.secondYear.value;
    return {
      firstYearValue,
      secondYearValue,
      firstYearValueString: firstYearValue.getFullYear().toString(),
      secondYearValueString: secondYearValue.getFullYear().toString(),
    };
  }

  /**
   * Gets a date for the second year based on the provided Moment object.
   *
   * @param {Moment} evento - The Moment object from which the year is retrieved.
   * @param {number} max - Il parametro da aggiungere al primo anno
   * @return {number} The timestamp for the first day of the year following the year in the provided Moment object.
   */
  private getSecondYear(evento: Moment, max: number = 1): number {
    return new Date().setFullYear(evento.year() + max, 0, 0);
  }

  /**
   * Returns the timestamp representing the start of the year for the given date.
   *
   * @param {Moment} evento - The date object used to obtain the year.
   * @return {number} - The timestamp representing January 1st of the given year.
   */
  private getStartOfYear(evento: Moment): number {
    return new Date().setFullYear(evento.year(), 0, 1);
  }

  ngOnInit(): void {
  }

  trackByKey = (index: number, item: Item) => {
    return item.key;
  };

  isEqual(objA: string, objB?: any): boolean {
    if (!objB) {
      return false;
    }
    return objA === objB;
  }

  /**
   * Handles changes to input fields and validates the form based on the specified report type.
   *
   * @param {IOnFieldChangeParams} value  - The object containing field values for validation.
   *
   * @return {void}
   */
  onFieldChange(value?: IOnFieldChangeParams): void {
    let reportSpecialisticoValue = this.reportSpecialistico.value;
    let isValid: boolean = false;

    switch (reportSpecialisticoValue) {
      case 'no2_nox_ratio':
        isValid = !!(
          this.firstDate?.value
          && this.lastDate?.value
          && this.keysControl?.value
          && (!this.keyStationControl || this.keyStationControl.value) // Esegui controllo solo se keyStationControl è presente
        );
        break;

      case 'trend_analysis':
        isValid = !!(
          this.firstYear?.value
          && this.secondYear?.value
          && this.keyParametersControl?.value
          && this.keysControl?.value
          && this.keysControl?.value.length > 0
          && (!this.keyStationControl || (this.keyStationControl.value && this.keyStationControl.value.length > 0)) // Verifica solo se keyStationControl è presente
        );
        if (value && value.min) {
          isValid = isValid && this.keyStationControl.value.length >= value.min;
        }
        break;

      case 'persistence_analysis':
        isValid = !!(
          this.firstYear?.value
          && this.secondYear?.value
          && this.keysControl?.value
          && this.keysControl.value.length > 0
          && (!this.keyStationControl || (this.keyStationControl.value && this.keyStationControl.value.length > 0)) // Verifica solo se keyStationControl è presente
          && this.keySensorsControl?.value
          && this.keySensorsControl.value.length > 0
        );
        break;

      default:
        isValid = false;
    }
    this.formStatusSpecialistica.emit(isValid);
  }


  selectAll(event: MatCheckboxChange, param: FormControl, items: Array<Item> = [], type?: string) {
    if (event.checked) {
      let keys = null;
      // Gestisci il caso in cui items potrebbe essere undefined
      if (type !== 'sensor') {
        keys = items.map((item) => item.key);
      } else {
        keys = items.map((item) => item.keys);
      }
      param?.setValue(keys);
    } else {
      // Deseleziona tutto
      param?.setValue([]);
    }
  }

  callService() {
    // Docrei chiamare il service per chiamare i report
    let reportSpecialisticoValue = this.reportSpecialistico.value;
    console.info('Selezionato', reportSpecialisticoValue);
    this.timePeriod = undefined;

    // Controllo se date o anni sono con dei valori e quindi li devo resettare
    if (this.firstYear.value || this.secondYear.value) {
      this.firstYear.setValue(undefined);
      this.secondYear.setValue(undefined);
    }
    if (this.firstDate.value || this.lastDate.value) {
      this.firstDate.setValue(undefined);
      this.lastDate.setValue(undefined);
    }
    this.keysControl.setValue(undefined);
    this.keyStationControl.setValue(undefined);
    this.keyParametersControl.setValue(undefined);
    this.keySensorsControl.setValue(undefined);
    if (reportSpecialisticoValue && reportSpecialisticoValue !== 'none') {
      // Action Selezione dello specialistico
      this.storeService.dispatch(selectReportSpecialisticoElaborazioneAction(reportSpecialisticoValue));
      // Blocco il tipo db
      this.lockDb.emit(true);
    }
  }

  handleDate(data: MatDatepickerInputEvent<any, any>, time: 'inizio' | 'fine') {
    let startTimeValid = time === 'inizio' && this.firstDate.valid;
    let endDateValid = time === 'fine' && this.lastDate.valid;
    if (startTimeValid || endDateValid) {
      let firstDateValue: Moment = this.firstDate.value;
      let lastDateValue: Moment = this.lastDate.value;
      let beginTimestamp = firstDateValue.utc().valueOf();
      let endTimeStamp = lastDateValue.utc().valueOf();
      let body: IDateToService = {
        begin: beginTimestamp + (120 * 60 * 1000),
        end: endTimeStamp + (120 * 60 * 1000),
        beginUtc: format(beginTimestamp, 'yyyy-MM-dd HH:mm:ss'),
        endUtc: format(endTimeStamp, 'yyyy-MM-dd HH:mm:ss'),
      };


      this.storeService.dispatch(selectedDateElaborazioneAction(body));
    }
  }

  yearSelect(evento: Moment, {annoSelected = 'primo', datapicker, timeState}: IYearsProps) {
    console.log(evento, 'Evento years');

    // Prendo il valore min e max degli anni
    if (timeState.time?.countMax && timeState.time.countMin) {
      switch (annoSelected) {
        case 'primo':
          let anno = this.getStartOfYear(evento);
          let secondYear = this.getSecondYear(evento, timeState.time.countMax);
          this.firstYear.setValue(new Date(anno));
          // Aumento di un anno il secondo
          this.secondYear.setValue(new Date(secondYear));
          datapicker.close();
          // Salvo sullo store le date
          this.storeService.dispatch(saveYearsToSpecialisticoElaborazioneAction(this.getSelectedYears()));
          break;
      }
    } else if (timeState.id?.includes('trend')) {
      console.info('Entro qui', timeState.id);
      if (annoSelected === 'primo') {
        // Creo la data
        let date = new Date(this.getStartOfYear(evento));
        // Setto il valore del form
        this.firstYear.setValue(date);
        datapicker.close();
      }
      if (annoSelected === 'secondoAnno') {
        let date = new Date(this.getStartOfYear(evento));
        this.secondYear.setValue(date);
        datapicker.close();
      }
      // Setto il valore del primo anno al primo giorno
      // Salvo sullo store le date
      if (this.firstYear.valid && this.secondYear.valid) {
        this.storeService.dispatch(saveYearsToSpecialisticoElaborazioneAction(this.getSelectedYears()));
      }

    } else {
      let anno = this.getStartOfYear(evento);
      let secondYear = this.getSecondYear(evento);

      if (annoSelected === 'primo') {
        this.firstYear.setValue(new Date(anno));
        // Aumento di un anno il secondo
        this.secondYear.setValue(new Date(secondYear));
        // Salvo sullo store le date
        this.storeService.dispatch(saveYearsToSpecialisticoElaborazioneAction(this.getSelectedYears()));
      }
      datapicker.close();
    }

  }


  closeToSelected(type: ItemSearchType, complete: boolean = false) {
    switch (type) {
      case 'NETWORK':
        // Action inserisco le reti sullo store
        this.storeService.dispatch(
          selectReteSpecialisticaElaborazioneAction(this.keysControl.value)
        );
        break;
      case 'STATION':
        // Action inserisco le stazioni sullo store
        this.storeService.dispatch(
          selectStazioneSpecialisticaElaborazioneAction(
            this.keyStationControl.value,
            complete
          )
        );
        break;
      case 'PARAMETER':
        this.storeService.dispatch(
          selectParametersSpecialisticaElaborazione(
            [this.keyParametersControl.value],
            type
          )
        );
        break;
      case 'SENSOR':
        // Action inserisco i parametri
        let selectedKeyParameters: string[][] = this.keySensorsControl.value;
        this.storeService.dispatch(
          selectSensorsSpecialisticaElaborazioneAction(
            selectedKeyParameters.flat()
          )
        );
        break;
    }
  }
}
