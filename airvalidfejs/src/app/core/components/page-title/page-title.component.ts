/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Component, OnInit, Input } from '@angular/core';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-page-title',
  templateUrl: './page-title.component.html',
  styleUrls: ['./page-title.component.scss']
})
export class PageTitleComponent implements OnInit {

  @Input() titlePage = '';
  version= environment.version
  constructor() { }

  ngOnInit(): void {
  }

}
