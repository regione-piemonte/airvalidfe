import {Component, OnDestroy, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core'
import {forkJoin, Observable, Subscription} from 'rxjs'
import {MatDialogRef} from "@angular/material/dialog";
import {Store} from '@ngrx/store'
import {AppState} from '../../../../state';
import {dialogLavoroPeriodoSelector} from "@selectors/*";
import {UtilityService} from "@services/core/utility/utility.service";
import {ToggleGroup} from "@components/shared/dialogs";



@Component({
  selector: 'app-dialog-render-table',
  templateUrl: './dialog-render-table.component.html',
  styleUrls: ['./dialog-render-table.component.scss'],
})
export class DialogRenderTableComponent implements OnInit, OnDestroy {
  isSpecialisticoSelected = false;
  renderChoice?: ToggleGroup;

  //reportistica
  renderTableReportistica: Array<ToggleGroup> = [];
  renderTableReportisticaSpecialistica: Array<ToggleGroup> = [];

  //elaborazione
  renderTableElaborazione: Array<ToggleGroup> = [];

  private translationSubscription = new Subscription();

  tipo$ = this.storeService.select(dialogLavoroPeriodoSelector);

  constructor(
    private translate: TranslateService,
    private dialogRef: MatDialogRef<DialogRenderTableComponent, ToggleGroup>,
    private readonly storeService: Store<AppState>,
    private readonly utilityService: UtilityService
  ) {
  }

  private _getType<T>(array: Array<T & ToggleGroup>): Array<ToggleGroup> {
    // console.info('array', array)
    return array.map(({value, text}) => ({value, text}));
  }

  private _getTypeElaborazione<T>(array: Array<T & ToggleGroup>): Array<ToggleGroup> {
    // console.info('array', array)
    return array.map(({value, text, active, group, toggle_group}) => ({value, text, active, group, toggle_group}));
  }


  private getAllTranslations<T>() {
    this.translationSubscription.add(
      this.utilityService.getAllTranslations()
        .subscribe(({renderTableReportistica, renderTableReportisticaSpecialistica, renderTableElaborazione}) => {
      this.renderTableReportistica =              this._getType(renderTableReportistica);
      this.renderTableReportisticaSpecialistica = this._getType(renderTableReportisticaSpecialistica);
      this.renderTableElaborazione =              this._getTypeElaborazione(renderTableElaborazione);
    }));
  }

  ngOnInit(): void {
    this.getAllTranslations();
  }

  selectRender(value: ToggleGroup) {
    this.isSpecialisticoSelected = (value !== this.renderTableReportistica[0]);
    this.renderChoice = value;
  }

  onValueChange(updatedValue: ToggleGroup) {
    this.renderChoice = updatedValue;
  }

  selectToggle(value: ToggleGroup) {
    // console.info("value",value)
  }

  ngOnDestroy(): void {
    if (this.translationSubscription) {
      this.translationSubscription.unsubscribe();
    }
  }

  next() {
    this.dialogRef.close(this.renderChoice);
  }
}
