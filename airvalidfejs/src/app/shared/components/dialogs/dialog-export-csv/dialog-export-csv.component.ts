/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Router} from "@angular/router";


type TypeUrl = 'reportistica' | 'validazione' | 'elaborazione';

@Component({
  selector: 'app-dialog-export-csv',
  templateUrl: './dialog-export-csv.component.html',
  styleUrls: ['./dialog-export-csv.component.scss']
})
export class DialogExportCsvComponent implements OnInit {

  form!: FormGroup;
  listaFormatoData: Array<string> = ['DD/MM/YYYY HH:mm', 'YYYY-MM-DD HH:mm', 'MM/DD/YYYY HH:mm'];
  listaSeparatoreDati: Array<string> = [',', ';', '#', '&', '@'];
  listaSeparatoreDecimali: Array<string> = [',', '.'];
  listaType: Array<string> = ['Basic', 'Advanced'];

  typeCsv = this.fb.control(false);

  hasTipoElaborazione = false;
  locationDialog?: TypeUrl;

  constructor(
    private dialogRef: MatDialogRef<DialogExportCsvComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) data: any,
    private router: Router,
  ) {
    const currentUrl = this.router.url;
    this.hasTipoElaborazione = currentUrl.includes('elaborazione') || currentUrl.includes('reportistica');
    this.locationDialog = this.getLocation(currentUrl);
    if (this.locationDialog === 'elaborazione') {
      this.listaFormatoData = this.listaFormatoData.filter(item => item !== 'MM/DD/YYYY HH:mm')
    }
  }

  private getLocation(url: string): TypeUrl {
    let isElaborazioneUrl = url.includes('elaborazione');
    let isReportisticaUrl = url.includes('reportistica');
    return isReportisticaUrl ? 'reportistica' : isElaborazioneUrl ? 'elaborazione' : 'validazione';
  }


  ngOnInit(): void {

    this.form = this.fb.group({
      dataFormat: [this.listaFormatoData[0], [Validators.required]],
      dataSeparator: [this.listaSeparatoreDati[1], [Validators.required]],
      numberSeparator: [this.listaSeparatoreDecimali[0], [Validators.required]],
      type: [this.listaType[0], [Validators.required]],
    });
  }

  save() {

    this.dialogRef.close(!this.hasTipoElaborazione ? this.form.value : {...this.form.value, typeFormatCsv: this.typeCsv.value ? 'normal':'list', });
  }

  close() {
    this.dialogRef.close();
  }

}
