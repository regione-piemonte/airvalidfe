/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin , Observable , retry , Subject , switchMap , takeUntil , tap , timer , } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IGetStatusLock } from '../../../models/interface/BE/response/getLock';

@Injectable({
  providedIn: 'root',
})
export class PollingLockService {
  arrayStation: Array<any> = [];
  arrayStation$: Observable<any[]> = new Observable();

  private allParameters$: Observable<any[]>;
  private stopPolling = new Subject();

  constructor(private http: HttpClient) {
    this.allParameters$ = timer(0, environment.timerPollingDataLock).pipe(
      tap(() => console.log('arraystation', this.arrayStation)),
      switchMap(() => forkJoin(this.arrayStation).pipe()),
      retry({ delay: 5000 }),
      tap(console.log),
      takeUntil(this.stopPolling)
    );
  }

  setArray(array: Array<any>[]) {
    console.log('array', array);
    this.arrayStation = array;
  }

  deleteLoock(id: string) {

  }

  getAllParameters(): Observable<Array<IGetStatusLock & {measurementId: string}>> {
    return this.allParameters$.pipe(
      tap(() => console.log('data sent to subscriber'))
    );
  }

  ngOnDestroy() {
    this.stopPolling.next(null);
  }
}
