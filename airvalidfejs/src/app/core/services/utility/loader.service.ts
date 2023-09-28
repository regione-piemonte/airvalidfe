/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable( {
    providedIn: 'root'
} )
export class LoaderService {

    constructor( private spinner: NgxSpinnerService ) {}


    public showLoader(name: string = 'time') {
        this.spinner.show( name )
    }

    public hideLoader(name: string = 'time') {
        this.spinner.hide( name )
    }


}
