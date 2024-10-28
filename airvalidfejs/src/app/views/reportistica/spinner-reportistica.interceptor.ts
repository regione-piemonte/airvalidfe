/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import {NgxSpinnerService} from "ngx-spinner";
import {finalize} from "rxjs/operators";

@Injectable()
export class SpinnerReportisticaInterceptor implements HttpInterceptor {

  constructor(
    readonly spinner: NgxSpinnerService
  ) {

    console.log('Interceptor aperto')
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

    if (request.headers.get('useinterceptors')) {
      this.spinner.show('global');

      return next.handle(request).pipe(
        finalize(() => this.spinner.hide('global'))
      );
    }

    return next.handle(request);

  }
}
