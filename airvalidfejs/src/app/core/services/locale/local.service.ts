/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from '@angular/core';
import * as moment from 'moment';
import {PeriodType} from '@components/shared/grafico/compositive_grafic/models';
import {addDays, format, isAfter, isBefore} from 'date-fns';
import {Store} from "@ngrx/store";
import {AppState} from "../../../state";
import {dialogConfigSelector} from "@selectors/*";
import {filter, map, Observable, of, switchMap, take} from "rxjs";
import {ISelectPeriodoState} from "@reducers/*";
import {IPropsChangeLavoro, setDateStoreAction} from "@actions/*";

@Injectable( {
  providedIn: 'root'
} )
export class LocalService {

  START_DATE = 'startDate';
  END_DATE = 'endDate';

  constructor(
    private readonly store: Store<AppState>
  ) {
    this.setDefaultTimezone()
  }

  setDefaultTimezone() {
    moment.tz.setDefault( "Europe/Berlin" )
  }

  getItem( key: string ): string {
    return localStorage.getItem( key ) ?? '';
  }

  /**
   * Retrieve the time store as an observable.
   *
   * @returns {Observable<ISelectPeriodoState>} - The observable containing the time store.
   */
  getTimeStore(): Observable<ISelectPeriodoState> {
    return this.store.select<ISelectPeriodoState>(dialogConfigSelector).pipe(
      filter(data => !!data.periodo),
      take(1)
    )
  }

  getDataWithDataStore<T>(callback: (start: string, end: string) => Observable<T>) {
    return this.getTimeStore().pipe(
      map(({periodo}) => ({start: periodo?.dataInizioTime, end: periodo?.dataFineTime})),
      switchMap(({start, end}) => callback(start!,end!))
    )
  }

  getAnnoStore(fineAnno: boolean = false): Observable<number> {
    return this.getTimeStore().pipe(
      filter(data => !!data),
      map<ISelectPeriodoState, number>(({periodo}) => {
        return Number(format(new Date(!fineAnno ? +periodo?.dataInizioTime! : +periodo?.dataFineTime!), 'yyyy'));
      })
    )
  }

  setItem( key: string , value: string ): void {
    // localStorage.setItem( key , value );
  }

  setDateStore(key: keyof IPropsChangeLavoro, value: string) {
    this.store.dispatch(setDateStoreAction(key, value))
  }

  removeItem( key: string ): void {
    localStorage.removeItem( key );
  }

  clear(): void {
    localStorage.clear();
  }


  getPeriodoLocalObs<T>(formatOnlyDate: boolean = false): Observable<{ startDate: string, endDate: string }> {
    return this.getDataWithDataStore((start, end) => of({
      startDate: !formatOnlyDate ? this.getFormatPeriod( +start ) : this.getFormatPeriodDate( +start),
      endDate: !formatOnlyDate ? this.getFormatPeriod( +end ) : this.getFormatPeriodDate( addDays( new Date(+end), -1 ).getTime())
    }))
  }

  getFormatPeriod( date: number ) {
    return format( new Date( date ) , 'yyyy-MM-dd HH:mm:ss' );
  }

  getFormatPeriodDate( date: number ) {
    return format( date , 'yyyy-MM-dd' );
  }
}
