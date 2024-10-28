import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {

  constructor(private readonly _spinnerService: NgxSpinnerService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

    // patch per far girare lo spinner per i servizi di reportistica ed evitare spinner inutili per gli altri servizi
    const shouldShowSpinner = request.urlWithParams.includes('report');
    const shouldShowResultSpinner = request.urlWithParams.includes('/result/');
    if (shouldShowSpinner || shouldShowResultSpinner) {
      this._spinnerService.show('global');
    }

    return next.handle(request).pipe(
      finalize(() => {
        if (shouldShowSpinner) {
          this._spinnerService.hide('global');
        }
      }),
    );
  }
}
