/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component , Inject , OnInit } from '@angular/core';
import { FormBuilder , FormGroup , Validators } from '@angular/forms';
import { DialogParametersComponent } from '../dialog-parameters/dialog-parameters.component';
import { MAT_DIALOG_DATA , MatDialogRef } from '@angular/material/dialog';

@Component( {
  selector: 'app-dialog-linear-correction' ,
  templateUrl: './dialog-linear-correction.component.html' ,
  styleUrls: [ './dialog-linear-correction.component.scss' ]
} )
export class DialogLinearCorrectionComponent implements OnInit {
  form!: FormGroup;
  description: string;

  maxDate: any

  constructor(
    private fb: FormBuilder ,
    private dialogRef: MatDialogRef<DialogParametersComponent> ,
    @Inject( MAT_DIALOG_DATA ) data: any
  ) {
    this.description = data.description;
  }

  response: Array<any> = [];
  selected: Date | null = null

  currentView: 'multi-year' | 'year' | 'month' = 'month';


  ngOnInit() {


    this.form = this.fb.group( {
      slope: [ '' , [ Validators.required ] ] ,
      offset: [ '' , [ Validators.required ] ] ,
    } );


  }

  save() {
    this.dialogRef.close( this.form.value );
  }

  close() {
    this.dialogRef.close();
  }


}
