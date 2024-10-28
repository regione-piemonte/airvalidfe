/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { AfterViewInit , Component , Inject , OnDestroy , OnInit , ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA , MatDialogRef } from '@angular/material/dialog';
import { ITaratura } from '@models/grafico';
import { DataService } from '../../../../core/services';
import { filter , Subject , takeUntil } from 'rxjs';
import { ThemePalette } from '@angular/material/core';
import { MatSelectionList } from '@angular/material/list';
import {FormControl, Validators} from "@angular/forms";
import {Store} from "@ngrx/store";
import {AppState} from "../../../../state";
import {changeTypeTaratura} from "@reducers/*";

@Component({
  selector: 'app-dialog-taratura',
  templateUrl: './dialog-taratura.component.html',
  styleUrls: ['./dialog-taratura.component.scss']
})
export class DialogTaraturaComponent implements OnInit, AfterViewInit, OnDestroy {
  colorList: ThemePalette = 'primary';

  @ViewChild('tarature') tarature!: MatSelectionList;
  destroy$ = new Subject<void>();
  taratura: Array<ITaratura & {futureDate: number}> = [];
  taratureProgressive: FormControl = new FormControl('true', [Validators.required]);

  constructor(
    private dialogRef: MatDialogRef<DialogTaraturaComponent>,
    private readonly dataService: DataService,
    @Inject(MAT_DIALOG_DATA) public data: {actionButton: string, title: string, message: string, role?: string, taratura: ReadonlyArray<ITaratura>},
    readonly store: Store<AppState>,
  ) {

  }

  ngOnInit(): void {
    this.dataService.taraturaObs$
      .pipe(
        filter( data => !!data ),
        takeUntil( this.destroy$ )
      )
      .subscribe( {
      next: data => {
        this.data.taratura = data!;
        // this.taratura = this.getFutureTarature(data!);
        this.taratura = this.getFutureTaratureOnlyTrue(data!);
        // console.info(futureTaratureOnlyTrue);
      } ,
      error: err => {

      } ,
      complete: () => {}
    } )
    this._listenTipoTaratura();

  }

  /**
   * Listens for changes in the taratureProgressive form control's value and dispatches
   * an action to change the type of taratura based on the updated value.
   *
   * @return {void} This method does not return a value.
   */
  private _listenTipoTaratura(): void {
    this.taratureProgressive.valueChanges.subscribe(
      {
        next: data => this.store.dispatch(changeTypeTaratura(data))
      }
    )
  }

  private getFutureTaratureOnlyTrue(data: ITaratura[]): Array<ITaratura &  { futureDate: number }> {
    let result: Array<ITaratura & {futureDate?: number}> = [];
    for (const {calibrationApplied, ...tar} of data) {
      if (calibrationApplied) {
        result.push({...tar, calibrationApplied, futureDate: undefined});
      }
    }
    // verifico che ci siano almeno due tarature e cosi prendo il valore della prossima e la inserisco cone futureDate della taratura
    if (result.length >= 2) {
      result = result.map((tar, i , list) => {
        if ((i + 1) <= list.length - 1) {
          tar = {
            ...tar,
            futureDate: list[i+1].beginDate
          }
        }
        return tar
      })
    }
    return result.filter(item => !!item.futureDate) as Array<ITaratura &  { futureDate: number }>;
  }

  ngAfterViewInit(): void {


  }



  save() {
    let selected = this.tarature.selectedOptions.selected;
    let valueMap = selected.map<{start: number, end: number}>( item => item.value )[0];
    this.dialogRef.close(valueMap);
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


}
