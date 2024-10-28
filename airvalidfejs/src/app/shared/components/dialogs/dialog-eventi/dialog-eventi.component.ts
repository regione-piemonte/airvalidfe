import { Component, Inject, OnInit } from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import IGetEventsResponse from '@models/eventi/getEvents'

@Component({
  selector: 'app-dialog-eventi',
  templateUrl: './dialog-eventi.component.html',
  styleUrls: ['./dialog-eventi.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0', display: 'none'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class DialogEventiComponent implements OnInit {

  columnsToDisplay = ['origin', 'type',  'beginDate', 'endDate', 'notes'];
  expandedElement: IGetEventsResponse | undefined;

  constructor(
    public dialogRef: MatDialogRef<DialogEventiComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Array<IGetEventsResponse>
  ) { }

  ngOnInit(): void {
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  toggleExpansion(element: any) {
    if (element.notes.length > 200 && this.expandedElement === element) {
      this.expandedElement = this.expandedElement === element ? undefined : element;
    }
  }

}
