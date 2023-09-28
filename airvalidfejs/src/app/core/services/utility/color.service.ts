/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  constructor() {
  }

  count=-1
  private colorsList = [
   
    '#FA9600',
    '#7DBC00',
    '#00A0FD',
    '#C070F4',
    '#4AE9EF',//'#FC968D',
    '#F60052',
    '#008148',
    '#00BCBE',
    '#976DF7',
    '#FABE0A',
    '#009091',
    /*'#F8D97C',
    '#FABE0A',
    '#FA9600',
    '#E56E24',
    '#FC968D',
    '#F51500',
    '#F60052',
    '#C070F4',
    '#976DF7',
    '#5071DC',
    '#00A0FD',*/
    '#00BCBE',//ООВСВЕ',
    '#009091',
    '#008148',
    '#7DBC00',//7DBCOO',
    '#A8DF00',
  ];

  getColorsList() {
    return this.colorsList;
  }

  getColor(index: number) {
    if (this.count  < (this.colorsList.length-1)) {
      this.count++
    return this.colorsList[this.count]
    }
    else{
      this.count=0
      return this.colorsList[this.count]
    }
   /* this.count++
    if ((7 + (this.count * 3)) < (this.colorsList.length-1)) {
     
      console.log("indice",((7 + this.count * 3)))
      return this.colorsList[7 + this.count * 3];
    } else {
      
   
      console.log("indice",(((7 + this.count * 3) % 16)))
      return this.colorsList[((7 + this.count * 3) % 16)];
    }*/
  }

  generateColor() {
    return (
      '#' + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6)
    );
  }
}
