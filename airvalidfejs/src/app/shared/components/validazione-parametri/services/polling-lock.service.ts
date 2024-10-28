/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {forkJoin, interval, Observable, of, retry, Subject, switchMap, takeUntil, tap, timer,} from 'rxjs';
import { environment } from '@environments/environment';
import { IGetStatusLock } from '@models/interface/BE/response/getLock';
import {IParameter} from "@models/dataService";

export type ArrayStationType = Array<Observable<IGetStatusLock>>;

@Injectable({
  providedIn: 'root',
})
export class PollingLockService {
  arrayStation: ArrayStationType = [];
  arrayStation$: Observable<any[]> = new Observable();

  private allParameters$: Observable<any[]> = of([]);
  stopPolling = new Subject();
  private arrayListToPolling$: Observable<IParameter[]> = of([]);

  constructor(private http: HttpClient) {
    // this.allParameters$ = timer(0, environment.timerPollingDataLock).pipe(
    //   switchMap(() => forkJoin(this.arrayStation).pipe()),
    //   retry({ delay: 5000 }),
    //   takeUntil(this.stopPolling)
    // );
  }

  setArray(array: ArrayStationType) {
    // console.info('array', array);
    this.arrayStation = array;
  }

  setListParametriToPolling(array: Observable<IParameter[]>) {
    this.arrayListToPolling$ = array;
  }

  getAllParameters(): Observable<Array<IGetStatusLock >> {
    return this.allParameters$.pipe(
      // tap(() => console.info('data sent to subscriber'))
    );
  }

  /**
   * Starts polling for data at a specified interval.
   *
   * @returns {Observable} An observable that emits data at the specified interval until `stopPolling` is triggered.
   */
  startPolling(): Observable<IParameter[]> {
    return interval(environment.timerPollingDataLock).pipe(
      // tap(() => console.info('polling started')),
      switchMap(() => this.arrayListToPolling$),
      takeUntil(this.stopPolling)
    );
  }

  ngOnDestroy() {
    this.stopPolling.next(null);
  }
}
