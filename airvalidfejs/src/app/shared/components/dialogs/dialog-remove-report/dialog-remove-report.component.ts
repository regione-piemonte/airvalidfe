import { deleteReportAction } from '@actions/*'
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { stateToReportSelector } from '@selectors/*';
import { LocalService } from '@services/core/index';
import { AppState } from 'src/app/state';
import {IListReport} from "@reducers/*";

export type TypeRecords = Record<string, IListReport[]>;

@Component({
  selector: 'app-dialog-remove-report',
  templateUrl: './dialog-remove-report.component.html',
  styleUrls: ['./dialog-remove-report.component.scss'],
})
export class DialogRemoveReportComponent implements OnInit {
  listReport$ = this.storeService.select(stateToReportSelector);
  forms: { [key: string]: FormGroup } = {};
  tipiReport: string[] = [
    'listAssenti',
    'listCertified',
    'listNotCertified',
    'listValidata',
    'listNotValid',
    'listValidationNull',
    'listIpaMetalli',
    'listDaRivedere',
  ];

  constructor(
    private dialogRef: MatDialogRef<DialogRemoveReportComponent>,
    private readonly storeService: Store<AppState>,
    private fb: FormBuilder,
    private readonly localService: LocalService,
    private readonly _translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.tipiReport.forEach((key) => {
      this.forms[key] = this._createForm();
    });
  }

  private _createForm(): FormGroup {
    return this.fb.group({
      report: ['', [Validators.required]],
    });
  }


  // Metodo per controllare se almeno uno degli array contiene almeno un elemento
checkIfAnyArrayNotEmpty(): boolean {
  return this.tipiReport.some((tipo) => {
    const list = this.forms[tipo]?.get('report')?.value;
    return list && list.length > 0;
  });
}

  getTitle(key: string): string {
    const translationMap: { [key: string]: string } = {
      listAssenti: 'page.reportistica.split_right.listAssenti',
      listCertified: 'page.reportistica.split_right.listCertified',
      listNotCertified: 'page.reportistica.split_right.listNotCertified',
      listValidata: 'page.reportistica.split_right.listValidata',
      listNotValid: 'page.reportistica.split_right.listNotValid',
      listValidationNull: 'page.reportistica.split_right.listValidationNull',
      listIpaMetalli: 'page.reportistica.split_right.listIpaMetalli',
      listDaRivedere: 'page.reportistica.split_right.listDaRivedere',
    };

    return this._translateService.instant(translationMap[key] || key);
  }

  // selectAll(
  //   event: MatCheckboxChange,
  //   param: string,
  //   arraySelect: Array<Object> = []
  // ) {
  //   this.form.get(param)?.setValue(event.checked ? [...arraySelect] : null);
  // }

  close() {
    this.dialogRef.close();
  }

  removeReports() {
    const mergedReports: TypeRecords = {}
    this.tipiReport.forEach((key) => {
      const reportValue = this.forms[key].get('report')!.value;
      if (reportValue) {
        mergedReports[key] = reportValue;
      }
    });
    this.storeService.dispatch(deleteReportAction(mergedReports));
    this.dialogRef.close();
  }
}
