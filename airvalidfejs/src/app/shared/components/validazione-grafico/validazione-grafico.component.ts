/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component , Input , OnInit , Output } from '@angular/core';
import { BehaviorSubject , Observable } from 'rxjs';

@Component( {
    selector: 'app-validazione-grafico' ,
    templateUrl: './validazione-grafico.component.html' ,
    styleUrls: [ './validazione-grafico.component.scss' ]
} )
export class ValidazioneGraficoComponent implements OnInit {

    @Input() dataset: Observable<any> = new Observable()
    @Input() visibilityNotValidDataSeries: Observable<any> = new Observable()
    @Input() visibilitySeries: Observable<any> = new Observable()
    @Input() deleteSeries: Observable<string> = new Observable()
    @Input() changeColorSeries: Observable<{ name: string; color: string }> = new Observable()
    @Input() changeValueInput: Observable<any> = new Observable()
    @Output() outputSeriesGrafico: BehaviorSubject<any> = new BehaviorSubject( null )

    constructor() { }

    ngOnInit(): void {

    }

}
