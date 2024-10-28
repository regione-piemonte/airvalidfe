import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatAccordion} from "@angular/material/expansion";
import {IResponseAllValidata} from "@state/effects/*";
import { TranslateService } from '@ngx-translate/core'
import { Store } from '@ngrx/store'
import { AppState } from 'src/app/state'
import { periodoReportisticaSelector } from '@selectors/*'

export interface IPeriod {
  dataInizio: string;
  dataFine: string;
}


@Component({
  selector: 'card-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss']
})
export class AccordionComponent implements OnInit {
  @ViewChild(MatAccordion) accordion!: MatAccordion;
  @Input() lista: Array<IResponseAllValidata> = [];
  @Input() renderChoice: string = '';
  @Input() title: string = '';
  @Input() period$: IPeriod = {dataInizio: '', dataFine: ''};
  @Input() titleReport: string = '';
  displayedColumns: string[] = ['timestamp', 'valore_validato'];
  reportData$ = this._storeService.select(periodoReportisticaSelector);

  constructor(
    private _translateService: TranslateService,
    private _storeService: Store<AppState>
  ) { }


  ngOnInit(): void {
  }

  titleDateTime(date: string): string {
    return this._translateService.instant('page.reportistica.split_right.title_accordion') + date;
  }

}
