/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { AfterViewInit , Component , Inject , OnDestroy , OnInit , ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA , MatDialogRef } from '@angular/material/dialog';
import { IData } from '../../../../views/validazione/validazione.component';
import { ITaratura } from '../../../../core/models/grafico';
import { DataService } from '../../../../core/services/data/data.service';
import { filter , Subject , switchMap , takeUntil } from 'rxjs';
import { ThemePalette } from '@angular/material/core';
import { MatListOption , MatSelectionList } from '@angular/material/list';

@Component({
  selector: 'app-dialog-taratura',
  templateUrl: './dialog-taratura.component.html',
  styleUrls: ['./dialog-taratura.component.scss']
})
export class DialogTaraturaComponent implements OnInit, AfterViewInit, OnDestroy {
  colorList: ThemePalette = 'primary';

  @ViewChild('tarature') tarature!: MatSelectionList;
  destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<DialogTaraturaComponent>,
    private readonly dataService: DataService,
    @Inject(MAT_DIALOG_DATA) public data: {actionButton: string, title: string, message: string, role?: string, taratura: ReadonlyArray<ITaratura>}
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
      } ,
      error: err => {

      } ,
      complete: () => {}
    } )

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
