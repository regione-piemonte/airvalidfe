/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogState } from '@angular/material/dialog';
import { DialogInfoComponent } from '../dialog-info/dialog-info.component';
import { Observable, finalize } from 'rxjs';
import { DialogTaraturaComponent } from '../dialog-taratura/dialog-taratura.component';
import { ITaratura } from '../../../../core/models/grafico';
import { DialogPersonalizzaPeriodoComponent } from '../dialog-personalizza-periodo/dialog-personalizza-periodo.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  dialogRef:any=undefined
  constructor(
    private dialog: MatDialog,
  ) { }


  openInfoDialog(title:string,message:string,actionTitle?:string, type?: string):Observable<any>{
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      title: title,
      message: message,
      role: type,
      actionButton:actionTitle
    };

    if(this.dialogRef && this.dialogRef.getState() != MatDialogState.OPEN) {
      this.dialogRef = this.dialog.open(DialogInfoComponent, dialogConfig);
  }
  else if(!this.dialogRef){
    this.dialogRef = this.dialog.open(DialogInfoComponent, dialogConfig);
  }
  return this.dialogRef.afterClosed()


  }

  openDialogTaratura(actionTitle?:string, type?: string, tarature?: ReadonlyArray<ITaratura>): Observable<{ start: number, end: number }> {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      title: 'Attenzione' ,
      message: 'Modificheremo la taratura del sensore. Vuoi procedere?' ,
      actionButton: actionTitle,
      taratura: tarature
    };

    if ( this.dialogRef && this.dialogRef.getState() != MatDialogState.OPEN ) {
      this.dialogRef = this.dialog.open( DialogTaraturaComponent , dialogConfig );
    } else if ( !this.dialogRef ) {
      this.dialogRef = this.dialog.open( DialogTaraturaComponent , dialogConfig );
    }

    return this.dialogRef.afterClosed();
  }

  openDialogSetPeriodoPersonalizzato(): Observable<{ start: string, end: string }> {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      title: 'Attenzione' ,
      message: 'Modificheremo il periodo di visualizzazione. Vuoi procedere?' ,
      actionButton: 'Conferma',
    };

    if ( this.dialogRef && this.dialogRef.getState() != MatDialogState.OPEN ) {
      this.dialogRef = this.dialog.open( DialogPersonalizzaPeriodoComponent , dialogConfig );
    } else if ( !this.dialogRef ) {
      this.dialogRef = this.dialog.open( DialogPersonalizzaPeriodoComponent , dialogConfig );
    }

    return this.dialogRef.afterClosed();
  }
}

