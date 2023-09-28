/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
 import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table'
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-impostazioni',
  templateUrl: './impostazioni.component.html',
  styleUrls: ['./impostazioni.component.scss']
})
export class ImpostazioniComponent implements OnInit {

  supportedLanguages = ['en', 'it']; // Aggiungi le lingue supportate
  selectedLanguage = 'it'; // Lingua predefinita
  tablePreset = new MatTableDataSource<any>();
  displayedColumns = [
    'id',
    'name',
    'rete',
    'stazioni',
    'parametri',
    'azioni'
  ]
  


  constructor(
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.tablePreset.data = [
      {
        id: '1',
        name: 'ABC',
        rete: [
          'Rete 1', 'Rete 2', 'Rete 3'
        ],
        stazioni: [
          'Stazione 1', 'Stazione 2', 'Stazione 3' 
        ],
        parametri: [
          'Parametri 1', 'Parametri 2', 'Parametri 3'
        ]
      },
      {
        id: '2',
        name: 'DEF',
        rete: [
          'Rete 1', 'Rete 2', 'Rete 3'
        ],
        stazioni: [
          'Stazione 1', 'Stazione 2', 'Stazione 3' 
        ],
        parametri: [
          'Parametri 1', 'Parametri 2', 'Parametri 3'
        ]
      },
      {
        id: '3',
        name: 'GHI',
        rete: [
          'Rete 1', 'Rete 2', 'Rete 3'
        ],
        stazioni: [
          'Stazione 1', 'Stazione 2', 'Stazione 3' 
        ],
        parametri: [
          'Parametri 1', 'Parametri 2', 'Parametri 3'
        ]
      }
    ]
  }

  changeLanguage() {
    console.log('selectedLanguage' + this.selectedLanguage);
    this.translateService.use(this.selectedLanguage);
  }

}
