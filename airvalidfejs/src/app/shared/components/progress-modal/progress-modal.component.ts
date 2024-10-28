import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-progress-modal',
  templateUrl: './progress-modal.component.html',
  styleUrls: ['./progress-modal.component.scss']
})
export class ProgressModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public progress: number | undefined) { }
}