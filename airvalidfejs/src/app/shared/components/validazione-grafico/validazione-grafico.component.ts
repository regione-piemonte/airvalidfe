/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {ChangeDetectionStrategy, Component, Input, OnInit, Output} from '@angular/core';
import {BehaviorSubject, Observable, take} from 'rxjs';
import {AppState} from "../../../state";
import {Store} from "@ngrx/store";
import {isDataDialogSelector, parametriSelector} from "@selectors/*";
import {IVisibility} from "@components/shared/dialogs/dialog-remove-parameter/dialog-remove-parameter.component";
import {INameColor} from "@components/shared/validazione-parametri/model/validazione-parametri.model";

@Component({
  selector: 'app-validazione-grafico',
  templateUrl: './validazione-grafico.component.html',
  styleUrls: ['./validazione-grafico.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidazioneGraficoComponent implements OnInit {

  @Input() dataset: Observable<any> = new Observable().pipe(take(1))
  @Input() visibilityNotValidDataSeries = new Observable<IVisibility| null>()
  @Input() visibilitySeries: Observable<any> = new Observable()
  @Input() deleteSeries: Observable<string | null> = new Observable()
  @Input() changeColorSeries= new Observable<INameColor>()
  @Input() changeValueInput: Observable<any> = new Observable()
  @Output() outputSeriesGrafico: BehaviorSubject<any> = new BehaviorSubject(null)

  isDataDialog$ = this.storeService.select(isDataDialogSelector);

  // Uso il parametri selector per creare il componente grafico
  isLengthParametri$ = this.storeService.select(parametriSelector);

  constructor(
    private readonly storeService: Store<AppState>,
  ) {
  }

  ngOnInit(): void {

  }

}
