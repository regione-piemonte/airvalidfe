/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class ExpandAreaService {
  private slideASubject = new Subject<number>();
  private slideBSubject = new Subject<number>();

  slideA$ = this.slideASubject.asObservable();
  slideB$ = this.slideBSubject.asObservable();

  updateSlideA(size: number) {
    this.slideASubject.next(size);
  }

  updateSlideB(size: number) {
    this.slideBSubject.next(size);
  }
}
