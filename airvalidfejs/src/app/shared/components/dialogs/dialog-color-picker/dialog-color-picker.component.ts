/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component , Inject , OnInit } from '@angular/core';
import { MAT_DIALOG_DATA , MatDialogRef } from '@angular/material/dialog';
import { ColorPickerControl } from '@iplab/ngx-color-picker';
import { ColorService } from '../../../../core/services';

@Component({
  selector: 'app-dialog-color-picker',
  templateUrl: './dialog-color-picker.component.html',
  styleUrls: ['./dialog-color-picker.component.scss']
})
export class DialogColorPickerComponent implements OnInit {
color:string='#000'

public chromeControl = new ColorPickerControl()
.setValueFrom('#ff0000')
.setColorPresets(this.colorService.getColorsList())
//.hidePresets()
//.hideAlphaChannel();

  constructor(
    private colorService:ColorService,
    private dialogRef: MatDialogRef<DialogColorPickerComponent>,
    @Inject(MAT_DIALOG_DATA) data: any
  ) { }

  ngOnInit(): void {
  }



  save() {
    this.dialogRef.close(this.color);
  }

  close() {
    this.dialogRef.close();
  }

}
