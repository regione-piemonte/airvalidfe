import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';

@Injectable()
export class SetMessageErrorInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
        catchError((error: HttpErrorResponse) => {
          if ( error.status === 0 ) {
            return throwError(() => ({...error,message: 'Auth fallita'}) )
          }
          return throwError(() => error)
        } )
    );
  }
}
