/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {DialogExportCsvComponent} from '../dialog-export-csv/dialog-export-csv.component';
import { LocalService} from "@services/core/locale/local.service";
import {DateSettingService} from "@services/core/utility/date-setting.service";

@Component({
  selector: 'app-dialog-anno-select',
  templateUrl: './dialog-anno-select.component.html',
  styleUrls: ['./dialog-anno-select.component.scss']
})
export class DialogAnnoSelectComponent implements OnInit {

  form!: FormGroup;
  listaAnno: Array<number> = []

  constructor(
    private dialogRef: MatDialogRef<DialogExportCsvComponent>,
    private fb: FormBuilder,
    private readonly localService: LocalService,
    private readonly dataService: DateSettingService,
    @Inject(MAT_DIALOG_DATA) data: any
  ) {

    let anno = dataService.getYear();
    this.listaAnno = Array.from({length: 20}, (_, i) => anno - (i + 1));

  }
  private _initForm() {
    this.form = this.fb.group({
      anno: [this.listaAnno[0], [Validators.required]],
    });
  }

  ngOnInit(): void {
    this._initForm();
  }

  save() {
    this.dialogRef.close(this.form.value);
  }

  close() {
    this.dialogRef.close();
  }

}
