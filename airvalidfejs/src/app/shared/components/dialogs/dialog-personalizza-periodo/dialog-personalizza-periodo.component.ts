import { Component , Inject , OnInit } from '@angular/core';
import { FormBuilder , FormGroup , Validators } from '@angular/forms';
import { MAT_DIALOG_DATA , MatDialogRef } from '@angular/material/dialog';
import { LocalService } from '../../../../core/services/locale/local.service';

@Component( {
  selector: 'app-dialog-personalizza-periodo' ,
  templateUrl: './dialog-personalizza-periodo.component.html' ,
  styleUrls: [ './dialog-personalizza-periodo.component.scss' ]
} )
export class DialogPersonalizzaPeriodoComponent implements OnInit {
  periodoLocal = this.localService.getPeriodoLocal( true );
  description: string;
  form: FormGroup = this._createForm();

  constructor(
    private fb: FormBuilder ,
    private dialogRef: MatDialogRef<DialogPersonalizzaPeriodoComponent> ,
    private readonly localService: LocalService ,
    @Inject( MAT_DIALOG_DATA ) data: { description: string }
  ) {
    this.description = data.description;
  }

  ngOnInit() {

  }

  private _createForm(): FormGroup {
    let startDate = this.periodoLocal.startDate;
    let endDate = this.periodoLocal.endDate;
    return this.fb.group( {
      start: [ startDate , [ Validators.required ] ] ,
      end: [ endDate , [ Validators.required ] ] ,
    } , {
      validators: ( formGroup: FormGroup ) => {
        const start = formGroup?.get( 'start' )?.value;
        const end = formGroup?.get( 'end' )?.value;
        let periodoInferiore = start < startDate;
        let periodoSuperiore = end > endDate;
        let startMaggioreEnd = start > end;
        return startMaggioreEnd || periodoInferiore || periodoSuperiore ?  { range: true } : null;
      }
    } );
  }

  save() {
    this.dialogRef.close( this.form.value );
  }

  close() {
    this.dialogRef.close();
  }

}
