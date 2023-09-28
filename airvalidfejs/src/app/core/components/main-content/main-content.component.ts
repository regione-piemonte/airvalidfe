/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-main-content',
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss']
})
export class MainContentComponent implements OnInit {

  @Input() themeColor: string = '';

  openClose: boolean = true;

  constructor() { }

  ngOnInit(): void {
  }

  openCloseMenu(event: any) {
    this.openClose = event;
  }

}
