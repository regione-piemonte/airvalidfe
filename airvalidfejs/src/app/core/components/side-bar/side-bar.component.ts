/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core'
import { LanguageService } from '../../services/locale/language.service'
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent implements OnInit {
  openClose: boolean = true;

  sideMenuItems: Array<any> = []

  @Output() cssRefresh = new EventEmitter<boolean>();



  constructor(
    private translateService: TranslateService,
    private languageService: LanguageService,
    private readonly routerService: Router ,
  ) { }

  openCloseMenu() {
    this.openClose = !this.openClose;
    this.cssRefresh.emit(this.openClose);
  }

  ngOnInit(): void {
    this.languageService.currentLanguage$.subscribe((language: string) => {
      this.translateService.getTranslation(language).subscribe((res: any) => {
        this.sideMenuItems = [
          {
            name: res.main_menu.validazione,
            path: '/validazione',
            icon: 'event_available',
            disabled: false

          },
          {
            name: res.main_menu.reportistica,
            path: '/reportistica',
            icon: 'insert_drive_file',
            disabled: true

          },
          {
            name: res.main_menu.elaborazione,
            path: '/elaborazioni',
            icon: 'area_chart',
            disabled: true

          },
        ]
      })
    })
  }

  ricaricaValidazione() {
    location.replace('');
  }
}
