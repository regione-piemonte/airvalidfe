/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component, OnInit } from '@angular/core';
import { ThemeColorService } from '../../services/utility/theme-color.service'
import { ThemeFontService } from '../../services/utility/theme-font.service'

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent implements OnInit {

  changeSize$ = '';

  themeColor$ = '';

  constructor(
    private _themeColor: ThemeColorService,
    private _fontSize: ThemeFontService
  ) { }

  ngOnInit(): void {

    this.changeSizeEvent();
    this.themeColorEvent();
  }

  changeSizeEvent() {
    this._fontSize.currentFont$.subscribe((value) => {
      if (value) {
        this.changeSize$ = value;
        const bodyFontSize = document.getElementById('app-ariaweb');
        bodyFontSize?.classList.add('font-size--' + value);
      }
    });
  }

  themeColorEvent() {
    this._themeColor.currentColor$.subscribe((value) => {
      if (value) {
        this.themeColor$ = value;
      }
    });
  }

}
