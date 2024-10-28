/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  Filter,
  FilterItem,
  IEventiAnagraficaResponse,
  IListTerritorialItem,
} from '@views/ricerca-eventi-anagrafica/models/ricerca_eventi_anagrafica.model';
import { FormControl } from '@angular/forms'; // <-- Importa FormControl

@Component({
  selector: 'app-risultati-ricerca',
  templateUrl: './risultati-ricerca.component.html',
  styleUrls: ['./risultati-ricerca.component.scss'],
})
export class RisultatiRicercaComponent implements OnInit, OnChanges {
  @ViewChild('focusPagination', { static: false }) focusPagination!: ElementRef;
  @Input() result!: IEventiAnagraficaResponse;
  @Output('filtroItem') filtro: EventEmitter<FilterItem & { id: string }> =
    new EventEmitter();
  @Output('newCount') countEvent: EventEmitter<number> = new EventEmitter();
  @Output('newPagination') paginationEvent: EventEmitter<{
    count: number;
    begin: number;
  }> = new EventEmitter();

  @Output('eventoReset') resetEmit: EventEmitter<void> = new EventEmitter();
  filtri: Array<Filter> = [];

  // Mappa dei titoli
  filterTitles: { [key: string]: string } = {
    networkName: 'Rete',
    stationName: 'Stazioni',
    sensorName: 'Parametri',
    origin: 'Tipo',
  };

  listChangeCount: Array<number> = [10, 50, 100];

  territorialItems: Array<IListTerritorialItem> = [];
  total!: number;

  countControl = new FormControl();
  countResult!: number;

  begin!: number;
  // Funzione per destrutturare l'input
  private _desResponse(response: IEventiAnagraficaResponse): void {
    const { count, filters, items, total, begin } = { ...this.result };
    this.filtri = [...filters];
    this.territorialItems = [...items];
    this.total = total;
    this.countResult = count;
    const closestValue = this.listChangeCount.includes(this.countResult)
      ? this.countResult
      : this.listChangeCount.reduce((prev, curr) =>
          Math.abs(curr - this.countResult) < Math.abs(prev - this.countResult)
            ? curr
            : prev
        );

    this.countControl.setValue(closestValue, {emitEvent: false});
    this.begin = begin;
  }
  constructor() // readonly ref: ChangeDetectorRef
  {}

  ngOnChanges(changes: SimpleChanges): void {
    this._desResponse(changes['result']?.currentValue);
  }

  ngOnInit(): void {
    // this.ref.detectChanges();
    this.countControl.valueChanges.subscribe((value) => {
      this.countEvent.emit(value);
    });
  }

  selectedFilter(item: FilterItem, id: string) {
    this.filtro.emit({ ...item, id });
  }

  resetEvent() {
    this.resetEmit.emit();
  }

  isResetActive(filtri: Array<Filter>) {
    return (
      filtri.length &&
      filtri.some((item) => item.items.some((subItem) => subItem.active))
    );
  }
  changePagination(type: 'prec' | 'succ') {
    switch (type) {
      case 'prec':
        let beginPrec = this.begin - this.countResult;
        this.paginationEvent.emit({
          count: this.countResult,
          begin: beginPrec,
        });
        break;
      case 'succ':
        let beginSuc = this.countResult + this.begin;
        this.paginationEvent.emit({ count: this.countResult, begin: beginSuc });
        break;
    }
    this.setFocus();
  }
  private setFocus() {
    if (this.focusPagination) {
      setTimeout(() => {
        this.focusPagination.nativeElement.focus();
      }, 0);
    }
  }
}
