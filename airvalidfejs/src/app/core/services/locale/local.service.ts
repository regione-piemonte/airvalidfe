/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import compareAsc from 'date-fns/compareAsc';
import * as moment from 'moment';
import { PeriodType } from '../../../shared/components/grafico/compositive_grafic/models';
import { format , isAfter , isBefore } from 'date-fns';
import { throwUnknownPortalTypeError } from '@angular/cdk/portal/portal-errors';

@Injectable( {
  providedIn: 'root'
} )
export class LocalService {

  START_DATE = 'startDate';
  END_DATE = 'endDate';

  constructor() {
    this.setDefaultTimezone()
  }

  setDefaultTimezone() {
    moment.tz.setDefault( "Europe/Berlin" )
  }

  getItem( key: string ): string {
    return localStorage.getItem( key ) ?? '';
  }

  setItem( key: string , value: string ): void {
    localStorage.setItem( key , value );
  }

  removeItem( key: string ): void {
    localStorage.removeItem( key );
  }

  clear(): void {
    localStorage.clear();
  }

  getLanguage(): string {
    return this.getItem( 'language' );
  }

  setLanguage( language: string ): void {
    this.setItem( 'language' , language );
  }

  getTimezone(): string {
    return this.getItem( 'timezone' );
  }

  setTimezone( timezone: string ): void {
    this.setItem( 'timezone' , timezone );
  }

  verifyTimezone( value: number , action?: PeriodType ): void {
    let diff = action === 'prec' ? isBefore( value , +this.getItem( this.START_DATE ) ): isAfter( value , +this.getItem( this.END_DATE ) );
    if ( action === 'prec' && value && diff ) {
      this.setItem( this.START_DATE , value.toString() );
    }
    if ( action === 'succ' && value && diff ) {
      this.setItem( this.END_DATE , value.toString() );
    }
  }

  getPeriodoLocal(formatOnlyDate: boolean = false): { startDate: string, endDate: string } {
    let startDate = !formatOnlyDate ? this.getFormatPeriod( +this.getItem( this.START_DATE ) ) : this.getFormatPeriodDate( +this.getItem( this.START_DATE ));
    let endDate = !formatOnlyDate ? this.getFormatPeriod( +this.getItem( this.END_DATE ) ) : this.getFormatPeriodDate( +this.getItem( this.END_DATE ));
    return {
      startDate,
      endDate
    }
  }

  getFormatPeriod( date: number ) {
    return format( new Date( date ) , 'yyyy-MM-dd HH:mm:ss' );
  }

  getFormatPeriodDate( date: number ) {
    return format( date , 'yyyy-MM-dd' );
  }
}
