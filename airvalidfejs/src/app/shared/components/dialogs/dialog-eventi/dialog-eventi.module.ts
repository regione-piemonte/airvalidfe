import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogEventiComponent } from './dialog-eventi.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { PipesModule } from 'src/app/core/pipes/pipes.module';

@NgModule({
  declarations: [
    DialogEventiComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    DragDropModule,
    MatIconModule,
    TranslateModule,
    PipesModule
  ],
  exports: [
    DialogEventiComponent
  ]
})
export class DialogEventiModule { }
