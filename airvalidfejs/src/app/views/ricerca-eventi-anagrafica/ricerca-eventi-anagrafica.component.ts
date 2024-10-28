/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Component} from '@angular/core';
import {IFormRicercaEventi} from "@views/ricerca-eventi-anagrafica/form-ricerca-eventi/form-ricerca-eventi.component";
import {IPropsPaginazione, RicercaAnagraficaEventiService} from "@views/ricerca-eventi-anagrafica/service/ricerca-anagrafica-eventi.service";
import {FilterItem, IEventiAnagraficaResponse} from "@views/ricerca-eventi-anagrafica/models/ricerca_eventi_anagrafica.model";

@Component({
  selector: 'app-ricerca-eventi-anagrafica',
  templateUrl: './ricerca-eventi-anagrafica.component.html',
  styleUrls: ['./ricerca-eventi-anagrafica.component.scss']
})
export class RicercaEventiAnagraficaComponent {

  responseRicercaEventi?: IEventiAnagraficaResponse;
  listaFiltri: Array<FilterItem & { id: string }> = [];

  private form?: IFormRicercaEventi;

  private _resetResponse() {
    this.responseRicercaEventi = {
      items: [],
      filters: [],
      begin: 0,
      total: 0,
      count: 0
    };
  }

  private _addActiveToFilter(response: IEventiAnagraficaResponse) {
    if (response.filters && response.filters.length) {
      response = {
        ...response,
        filters: response.filters.map(item => {
          if (this.listaFiltri.some(itemList => itemList.id === item.id && item.items.some(itemResponse => itemResponse.name === itemList.name))) {
            return {
              ...item,
              items: item.items.map(subItem => this.listaFiltri.some(itemList => itemList.name === subItem.name) ? {...subItem, active: true} : subItem)
            }
          }
          return item;
        })
      }
    }
    return response;
  }


  constructor(
    private readonly ricercaEventiAnagrafica: RicercaAnagraficaEventiService
  ) {

  }


  ricercaEventi(formRicercaEventi: IFormRicercaEventi, count?: number) {

    this.form = formRicercaEventi;
    this.listaFiltri = [];
    this.ricercaEventiAnagrafica.getRicercaAnagrafica(formRicercaEventi)
      .subscribe({
        next: ricerca => this.responseRicercaEventi = {...ricerca},
        error: error => console.log(error)
      })
  }

  ricercaEventiNewCount(count: number) {
    let body: IFormRicercaEventi & IPropsPaginazione = {
      count,
      ...this.form!
    }
    this.ricercaEventiAnagrafica.getRicercaAnagrafica(body, !!this.listaFiltri ? this.listaFiltri : []).subscribe({
      next: ricerca => {
        let responseWithFilterActive = this._addActiveToFilter(ricerca);
        this.responseRicercaEventi = {...responseWithFilterActive}
      },
      error: error => console.log(error)
    })
  }

  newPagination(paginazione: { count: number; begin: number }) {
    let body: IFormRicercaEventi & IPropsPaginazione = {
      count: paginazione.count,
      begin: paginazione.begin,
      ...this.form!
    }
    this.ricercaEventiAnagrafica.getRicercaAnagrafica(body, !!this.listaFiltri ? this.listaFiltri : []).subscribe({
      next: ricerca => {
        let responseWithFilterActive = this._addActiveToFilter(ricerca);
        this.responseRicercaEventi = {...responseWithFilterActive}
      },
      error: error => console.log(error)
    })
  }

  resetFilter() {
    this.listaFiltri = [];
    this.ricercaEventi(this.form!);
  }


  ricercaPerFiltro(filtro: FilterItem & { id: string },) {
    // Nel caso lista filtri vuota
    // Verifico che non ci sia l'id nella lista
    let isValidFilterId = this.listaFiltri.every(item => item.id !== filtro.id);
    if (!this.listaFiltri.length || isValidFilterId) {
      this.listaFiltri.push(filtro);
    } else {
      // Verifico che il filtro non sia presente nella lista
      // Verifico che abbia lo stesso id ma non lo stesso nome
      let isIdFilterNotName = this.listaFiltri.some(item => item.id === filtro.id && item.name !== filtro.name);

      if (isIdFilterNotName) {
        this.listaFiltri = this.listaFiltri.map(item => filtro.id === item.id ? {...item, name: filtro.name, count: filtro.count} : {...item});
      }
    }

    this.ricercaEventiAnagrafica.getRicercaAnagrafica(this.form!, this.listaFiltri)
      .subscribe({
        next: ricerca => {
          let responseWithFilterActive = this._addActiveToFilter(ricerca);
          this.responseRicercaEventi = {...responseWithFilterActive}
        },
        error: error => console.log(error)
      })
  }


}
