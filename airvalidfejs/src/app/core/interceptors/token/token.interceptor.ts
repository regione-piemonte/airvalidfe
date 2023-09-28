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
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from "ngx-spinner";
import { environment } from 'src/environments/environment';
import { DialogService } from 'src/app/shared/components/dialogs/services/dialog.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(
    private dialogService:DialogService,
    private spinner: NgxSpinnerService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.spinner.show('globalInterceptor');
    let  authorization=''
    if(!environment.production){
      authorization = btoa(environment.basicAuth.username+":"+environment.basicAuth.password)
    }
   
    if(!environment.production){

      request = request.clone({
        
          setHeaders: {Authorization: `Basic ${authorization}`}
        
       });
    }
    else{
      request = request.clone({
     
       });
    }
   
 

  return next.handle(request).pipe(
    finalize(() => {
      this.spinner.hide('globalInterceptor');
    }),
  	catchError((err) => {
   	 if (err instanceof HttpErrorResponse) {
       	 if (err.status === 401) {
       
     	}
 
      this.dialogService.openInfoDialog("Attenzione",`Codice errore: ${err.status},  Messaggio: ${err.message}`,"","error")


 	 }
  	return throwError(err);
	})
   )
  }
}


