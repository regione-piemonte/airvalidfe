/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-export-csv',
  templateUrl: './dialog-export-csv.component.html',
  styleUrls: ['./dialog-export-csv.component.scss']
})
export class DialogExportCsvComponent implements OnInit {

  form!: FormGroup;
   listaFormatoData:Array<string>=['DD/MM/YYYY HH:mm','YYYY-MM-DD HH:mm','MM/DD/YYYY HH:mm']
   listaSeparatoreDati:Array<string>=[',',';','#','&','@']
   listaSeparatoreDecimali:Array<string>=['.',',']
   listaType:Array<string>=['Basic','Advanced']
  constructor(
    private dialogRef: MatDialogRef<DialogExportCsvComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) data: any
  ) { }

  ngOnInit(): void {

    this.form = this.fb.group({
      dataFormat: [this.listaFormatoData[0], [Validators.required]],
      dataSeparator: [this.listaSeparatoreDati[1], [Validators.required]],
      numberSeparator: [this.listaSeparatoreDecimali[0], [Validators.required]],
      type: [this.listaType[0], [Validators.required]],
    });
  }

  save() {
   
    this.dialogRef.close(this.form.value);
  }

  close() {
    this.dialogRef.close();
  }

}
