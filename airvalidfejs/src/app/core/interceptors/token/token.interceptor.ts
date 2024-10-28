/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse, HttpResponse
} from '@angular/common/http';
import {catchError, Observable, of, throwError} from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from "ngx-spinner";
import { environment } from '@environments/environment';
import {DialogService} from "@components/shared/dialogs/services/dialog.service";

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

    constructor(
        private dialogService: DialogService ,
        private spinner: NgxSpinnerService,
    ) {}

    intercept( request: HttpRequest<unknown> , next: HttpHandler ): Observable<HttpEvent<unknown>> {
        this.spinner.show( 'globalInterceptor' );
        let authorization = ''
        if ( !environment.production ) {
            authorization = btoa( environment.basicAuth.username + ":" + environment.basicAuth.password )
        }

        if ( !environment.production ) {

            request = request.clone( {

                setHeaders: { Authorization: `Basic ${ authorization }` }

            } );
        } else {
            request = request.clone( {} );
        }


        return next.handle( request ).pipe(
            finalize( () => {
                this.spinner.hide( 'globalInterceptor' );
            } ) ,
            catchError( ( err ) => {
                if ( err instanceof HttpErrorResponse ) {
                    if ( err.status === 401 ) {

                    }
                    if (err && err.status === 400  && err.url?.includes(('elaboration'))) {
                      err = {
                        ...err ,
                        pathError: 'dialog_interceptor.error.message'
                      }
                    }

                    if ( err.status === 0 ) {
                        // this.dialogService.openInfoDialog( "Attenzione" , `Codice errore: ${ err.status },  Messaggio: Auth Fallita` , "" , "error" )
                        err = {
                            ...err ,
                            message: 'Login non attiva. Si prega di procedere con l\'autenticazione ricaricando la pagina con <b>CTRL + R</b> se si utilizza Chrome oppure con <b>CTRL + F5</b> se si utilizza Firefox.'
                        }
                       window.location.reload();
                    }

                    this.dialogService.openInfoDialog( "Attenzione" , `Messaggio: ${ err.message } , Codice errore: ${ err.status }` , "" , "error" , err?.pathError ?? undefined)


                }
                return throwError( () =>  err );
            } )
        )
    }
}


