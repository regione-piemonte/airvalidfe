/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogParametersComponent } from '../dialog-parameters/dialog-parameters.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-max-min',
  templateUrl: './dialog-max-min.component.html',
  styleUrls: ['./dialog-max-min.component.scss'],
})
export class DialogMaxMinComponent implements OnInit {
  form!: FormGroup;
  description: string;

  maxDate: any;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DialogParametersComponent>,
    @Inject(MAT_DIALOG_DATA) data: any
  ) {
    this.description = data.description;
  }

  ngOnInit() {
    this.form = this.fb.group({
      max: ['', [Validators.required]],
      min: ['', [Validators.required]],
    });
  }

  save() {
    this.dialogRef.close(this.form.value);
  }

  close() {
    this.dialogRef.close();
  }
}
