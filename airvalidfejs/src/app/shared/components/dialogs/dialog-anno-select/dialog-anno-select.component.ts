/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogExportCsvComponent } from '../dialog-export-csv/dialog-export-csv.component';
import * as moment from 'moment';

@Component({
  selector: 'app-dialog-anno-select',
  templateUrl: './dialog-anno-select.component.html',
  styleUrls: ['./dialog-anno-select.component.scss']
})
export class DialogAnnoSelectComponent implements OnInit {

  form!: FormGroup;
   listaAnno:Array<number>=[]
  constructor(
    private dialogRef: MatDialogRef<DialogExportCsvComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) data: any
  ) {

    let anno=+moment(+localStorage.getItem('startDate')!)
    .utcOffset('+0100')
    .format('YYYY')
   
    for(let i=1; i<=20; i++){
      this.listaAnno.push(anno-i)
    }
   }

  ngOnInit(): void {

    this.form = this.fb.group({
      anno: [this.listaAnno[0], [Validators.required]],
     
    });
  }

  save() {
   
    this.dialogRef.close(this.form.value);
  }

  close() {
    this.dialogRef.close();
  }

}
