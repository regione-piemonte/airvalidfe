/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component , Inject , OnInit , } from '@angular/core';
import { FormBuilder , FormControl , FormGroup , Validators } from '@angular/forms';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS , MomentDateAdapter , } from '@angular/material-moment-adapter';
import { DateAdapter , MAT_DATE_FORMATS , MAT_DATE_LOCALE , } from '@angular/material/core';

import { NetworksService } from 'src/app/core/services/api/networks/networks.service';
import { DialogParametersComponent } from '../dialog-parameters/dialog-parameters.component';
import { MAT_DIALOG_DATA , MatDialogRef } from '@angular/material/dialog';

import * as moment from 'moment-timezone';
import { MatDatepicker } from '@angular/material/datepicker';

import { Moment } from 'moment';
import { CurrentViewType , MY_FORMATS , TypePeriod } from './models';
import { LocalService } from '../../../../core/services/locale/local.service';


@Component( {
  selector: 'app-dialog-init-config' ,
  templateUrl: './dialog-init-config.component.html' ,
  styleUrls: [ './dialog-init-config.component.scss' ] ,
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class DialogInitConfigComponent implements OnInit {
  currentView: CurrentViewType = 'month';
  date = new FormControl();
  description: string;
  form: FormGroup = this._getForm();
  maxDate: Moment = moment().add( 1 , 'days' );
  period: TypePeriod = "giornaliera"
  selected: Date | null = null
  showStep2: boolean = false;

  constructor(
    private fb: FormBuilder ,
    private networkService: NetworksService ,
    private dialogRef: MatDialogRef<DialogParametersComponent> ,
    @Inject( MAT_DIALOG_DATA ) data: { description: string },
    private readonly localService: LocalService ,
  ) {
    this.description = data.description;
  }

  /**
   * @description Ritorna il formGroup
   * @return {FormGroup}
   * @example
   * let form = this._getForm()
   * @Output {lavoro: '', startDate: '', endDate: ''}
   */
  private _getForm() {
    return this.fb.group( {
      lavoro: [ '' , [ Validators.required ] ] ,
      startDate: [ moment().subtract( 3 , 'days' ) , [ Validators.required ] ] ,
      endDate: [ moment().subtract( 1 , 'days' ) , [ Validators.required ] ] ,
    } );
  }


  /**
   * @description Set value form startDate and endDate
   * @param {string | Moment} startDate
   * @param {string | Moment} endDate
   * return void
   * @example
   * this._setValue({startDate: '2021-01-01', endDate: '2021-01-31'})
   * this._setValue({startDate: moment(), endDate: moment()})
   */
  private _setValue( { startDate , endDate }: { startDate?: string | Moment; endDate?: string | Moment } ) {
    this.form.get( 'startDate' )?.setValue( startDate );
    this.form.get( 'endDate' )?.setValue( endDate );
  }

  /**
   * @description Set value form days, months, years
   * @param {string} type
   * @param {number} startDateAmount
   * @param {number} endDateAmount
   * return void
   * @example
   * this._setValueByType('days')
   * this._setValueByType('months')
   * this._setValueByType('years')
   */
  private _setValueByType( type: TypePeriod , { startDateAmount , endDateAmount }: { startDateAmount?: Moment; endDateAmount?: Moment } ) {
    this.currentView = this._periodValue[ type ];
    this._setValue( { startDate: startDateAmount , endDate: endDateAmount } );
  }

  /**
   * @description Ritorna il valore del periodo selezionato
   */
  get _periodValue(): Record<TypePeriod , CurrentViewType> {
    return {
      giornaliera: 'month' ,
      mensile: 'year' ,
      annuale: 'multi-year'
    }
  }


  ngOnInit() {
  }

  save() {

    switch (this.period) {
      case 'giornaliera':

        let data = moment(this.form.get('endDate')?.value);
        let datetoString = moment(data).add(1, 'days').set({ hours: 2, minutes: 0, seconds: 0 }).tz("Europe/Berlin").valueOf().toString();
        this.form.get( 'endDate' )?.setValue( data );
        this.localService.setItem( 'endDate' , datetoString);
        break;
      case 'mensile':
        this._setValueByType( this.period , {
          startDateAmount: moment( this.form.get( 'startDate' )?.value ).startOf( 'month' ) ,
          endDateAmount: moment( this.form.get( 'startDate' )?.value ).endOf( 'month' )
        } )
        break;
      case 'annuale':
        this.currentView = this._periodValue[ this.period ];
        break;
    }

    localStorage.setItem(
      'startDate',
      moment(this.form.get('startDate')?.value,).set({ "hour": 1, "minute": 0 }).tz("Europe/Berlin").valueOf().toString()
    );

    if ( this.period == 'annuale' ) {
      localStorage.setItem(
        'endDate',
        moment(this.form.get('endDate')?.value,).add(1, 'days').set({ "hour": 0, "minute": 0 }).tz("Europe/Berlin").valueOf().toString())
    }
    else{
      //console.log("FINE", moment(this.form.get('endDate')?.value,).add(1, 'days').set({ "hour": 0, "minute": 0 }).tz("Europe/Berlin").format('DD/MM/YYYY HH:MM').toString())
      localStorage.setItem(
        'endDate',
        moment(this.form.get('endDate')?.value,).add(1, 'days').set({ hours: 1, minutes: 0, seconds: 0 }).tz("Europe/Berlin").valueOf().toString())

    }

    this.dialogRef.close(this.form.value);
  }

  close() {
    this.dialogRef.close();
  }

  next() {
    this.showStep2 = true;
  }

  setPeriod( event: TypePeriod ) {

    this.period = event
    this._setValue( { startDate: '' , endDate: '' } );

    switch (event) {
      case 'giornaliera':
        this._setValueByType( event , {
            startDateAmount: moment().subtract( 3 , 'days' ) ,
            endDateAmount: moment().subtract( 1 , 'days' )
          }
        );
        break;
      case 'mensile':
        this._setValueByType( event , {
          startDateAmount: moment().subtract( 1 , 'month' ).startOf( 'month' ) ,
          endDateAmount: moment().subtract( 1 , 'month' ).endOf( 'month' )
        } );
        break;
      case 'annuale':
        this._setValueByType( event , {
          startDateAmount: moment().subtract( 1 , 'year' ).startOf( 'year' ) ,
          endDateAmount: moment().subtract( 1 , 'year' ).endOf( 'year' )
        } );
        break;
    }
  }

  /**
   * @description Ricevo il periodo Moment e la data, settiamo il dataform con il moment ricevuto, e chiudo il datepicker
   * @param {Moment} normalizedDate
   * @param {MatDatepicker<Moment>} datepicker
   * @param {mese | anno} type
   * @example
   * this._chosenDateHandler(moment(), datepicker)
   * return void
   */
  chosenDateHandler( normalizedDate: Moment , datepicker: MatDatepicker<Moment>, type: 'mese'| 'anno' = 'mese' ) {
    let periodo: Moment = moment();
    let momentMouth: Moment = periodo.month(normalizedDate.month());
    let momentYear: Moment = periodo.year(normalizedDate.year());

    let value = type === 'mese' ? momentMouth : momentYear;
    this.date.setValue( value );
    let startDate = periodo.startOf( type === 'mese' ? 'month' : 'year' ).format( 'YYYY-MM-DD' );
    let endDate = periodo.endOf( type === 'mese' ? 'month' : 'year' ).format( 'YYYY-MM-DD' );

    this._setValue( { startDate , endDate } );
    let multi = this.currentView === 'multi-year';
    let year = this.currentView === 'year';
    if ( multi || year ) {
      datepicker.close();
    }

  }




}
