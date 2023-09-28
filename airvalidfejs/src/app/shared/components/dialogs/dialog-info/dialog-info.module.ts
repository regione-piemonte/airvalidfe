/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogInfoComponent } from './dialog-info.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [DialogInfoComponent],
  imports: [CommonModule, MatButtonModule,MatDialogModule, MatIconModule, TranslateModule],
  exports: [DialogInfoComponent],
})
export class DialogInfoModule {}
