/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { ICreateItemData } from './models';

export abstract class Grafic_abstractModel<T> {
  protected series: T[] = [];

  public resetSeries(i: number) {
    this.series.forEach( ( serie: any , index: number ) => {
      if ( index !== i ) {
        serie.markArea = {
          ...serie.markArea ,
          data: [] ,
        }
      }
    } );
  }
  public setSeries(serires: T[]) {
    this.series = serires;
  }
  public getSeries() {
    return this.series;
  }

  public getSerie(index: number): T {
    return JSON.parse(JSON.stringify(this.series[index]));
  }

  public setSerie(index: number, serie: T) {
    this.series[index] = JSON.parse(JSON.stringify(serie));
  }
  public addSerie(serie: T) {
    this.series.push(serie);
  }
  public removeSerie(serie: T) {
    this.series.splice(this.series.indexOf(serie), 1);
  }

  public isCompositive() {
    return false;
  }

  public isOrigin(value: Partial<ICreateItemData<any>>){
    return !!value && !!value.name && value.name.includes( 'origin' );
  }

  public abstract operation(): string;
}
