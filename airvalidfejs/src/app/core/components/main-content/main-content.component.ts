/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component, Input, OnInit } from '@angular/core';
import {Router} from "@angular/router";
import {ValidazioneComponent} from "@views/validazione/validazione.component";
import {ReportisticaComponent} from "@views/reportistica/reportistica.component";
import { ExpandAreaService } from '@services/core/utility/expand-area.service';

@Component({
  selector: 'app-main-content',
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss']
})
export class MainContentComponent implements OnInit {

  @Input() themeColor: string = '';


  // quasta variabile è collegata a side-bar.component.ts
  openClose: boolean = true;

  constructor(
    private readonly router: Router,
    private _expandareaservice: ExpandAreaService,
  ) { }

  ngOnInit(): void {
  }

  openCloseMenu(event: boolean) {
    this.openClose = event;
    if (!event) {
      this._expandareaservice.updateSlideA(100);
      this._expandareaservice.updateSlideB(0);
    } else {
      this._expandareaservice.updateSlideA(70);
      this._expandareaservice.updateSlideB(30);
    }
  }

  activate(evento: any) {
    // console.info(evento);
    if (evento instanceof ValidazioneComponent) {
      // console.info('Navigazione su Validazione ', evento);
    }
    if (evento instanceof ReportisticaComponent) {
      // console.info('Navigazione su Reportistica', evento);
    }
  }
}
