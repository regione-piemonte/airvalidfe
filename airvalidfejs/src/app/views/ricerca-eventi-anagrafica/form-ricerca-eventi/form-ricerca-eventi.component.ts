/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators} from "@angular/forms";
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter,} from '@angular/material-moment-adapter';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE,} from '@angular/material/core';
import { MY_FORMATS } from '@components/shared/dialogs';
import {DateSettingService} from "@services/core/utility/date-setting.service";
import {Moment} from "moment";

export interface IFormRicercaEventi {
  startDate: Date;
  endDate: Date;
  textInput: string;
  typeSelect: string;
}

// Funzione di validazione personalizzata
function endDateValidator(startDateControl: AbstractControl): ValidatorFn {
  return (endDateControl: AbstractControl) => {
    const startDate = startDateControl.value;
    const endDate = endDateControl.value;

    // Se startDate è valorizzato, verifica endDate
    if (startDate && endDate) {
      return endDate < startDate ? { endDateInvalid: true } : null; // Se endDate è precedente a startDate
    }
    return null; // Nessun errore
  };
}

@Component({
  selector: 'app-form-ricerca-eventi',
  templateUrl: './form-ricerca-eventi.component.html',
  styleUrls: ['./form-ricerca-eventi.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class FormRicercaEventiComponent implements OnInit {

  searchForm: FormGroup = this._createForm();
  @Output('formRicercaEventi') formRicercaEventi: EventEmitter<IFormRicercaEventi> = new EventEmitter();
  errorEndDate: boolean = false;
  errorMessage: string = '';
  @Output('eventoReset') resetEmit: EventEmitter<void> = new EventEmitter();

  constructor(
    private readonly fb: FormBuilder,
    readonly dateSetting: DateSettingService,
  ) {
  }


  private _createForm() {
    const formGroup = this.fb.group({
      startDate: [this.dateSetting.subDays(new Date(), 40)],
      endDate: [new Date()],
      textInput: [''],
      typeSelect: ['events', Validators.required],
    });
     // validazione tra startDate e endDate
    formGroup.get('endDate')?.setValidators(endDateValidator(formGroup.get('startDate')!));

    // validazione al cambio di startDate
    formGroup.get('startDate')?.valueChanges.subscribe(() => {
      formGroup.get('endDate')?.updateValueAndValidity();
    });

    return formGroup;
  }

  private _checkChangeForm() {
    return this.searchForm.valueChanges
      .pipe()
      .subscribe({
        next: value => console.info(value),
        error: error => console.log(error),
        complete: () => console.info('Complete form')
      })
  }

  ngOnInit(): void {
    // this._checkChangeForm();
  }

  onSelectChange() {
    if(this.searchForm.value['typeSelect']) {
      this.resetEmit.emit();
    }
  }

  onSubmit() {
    if (this.searchForm.valid) {
      let rawValue: IFormRicercaEventi = this.searchForm.getRawValue();

      if(rawValue.startDate) {
        const startDate = this.convertMomentToUtc(rawValue.startDate);
        rawValue.startDate = startDate || new Date();
        if(rawValue.endDate) {
          const endDate = this.convertMomentToUtc(rawValue.endDate);
          if (endDate && endDate < startDate!) {
            this.errorEndDate = true; // Imposta l'errore
            this.errorMessage = 'La data di fine deve essere successiva alla data di inizio.'; // Messaggio di errore
            return; // Non inviare il modulo
          }
          rawValue.endDate = endDate || new Date();
        }
      }

      this.formRicercaEventi.emit(rawValue);
    }
  }

  private convertMomentToUtc(momentDate: Moment | Date): Date | null {
    return momentDate && momentDate instanceof Date ? momentDate :  momentDate !== null ? momentDate.toDate() : null;
  }

}
