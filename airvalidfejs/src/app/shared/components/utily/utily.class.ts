/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {IParameter} from "@models/dataService";

export class UtilityClass {
  /**
   * Retrieves parameter and station with '- origin'.
   *
   * @param {IParameter} arg - The parameter object.
   * @return {string} The concatenated string of parameter name, station name, and "origin".
   * @example
   * let name = getParameterAndStationWithOrigin(parametro)
   */
  static getParameterAndStationWithOrigin({parametro, stazione}: IParameter): string {
    return parametro.name + ' - ' + stazione.name + ' - origin'
  }

  /**
   * @description Restituisce il nome del parametro senza origin
   * @param {IParameter} argomento
   * @return {string} - Restituisce il nome del parametro
   * @example
   * let name = getNameAndStation(parametro)
   */
  static getAParameterAndStationName({stazione, parametro}: IParameter | Partial<IParameter>): string {
    if (!stazione || !parametro) {
      throw new Error( !stazione ? 'Stazione non presente in parametro' : !parametro ? 'Parametro non presente in parametro' : 'Qualcosa non ha funzionato')
    }
    return parametro.name + ' - ' + stazione.name;
  }

  /**
   * Finds the index of an element in an array based on a specified property.
   *
   * @template T - The type of the elements in the array.
   * @template K - The type of the property to search for in the elements.
   * @param {T[]} value - The array to search in.
   * @param {K} keyof - The key of the property to search for.
   * @param {T[K]} ricerca - The value of the property to search for.
   * @param {keyof K} arg - Eventuali k successive
   * @returns {number} - The index of the first element in the array that matches the specified property value, or -1 if no such element is found.
   */
  static getIndex<T, K extends keyof T,F extends keyof T[K]>(value: T[], keyof: K, ricerca: T[K] | T[K][F], arg?: F): number {
    return value.findIndex(item => (arg ? item[keyof][arg] : item[keyof]) === ricerca);
  }

  static getObj<T>(lista:T[],index: number) {
    return lista[index];
  }

  /**
   * @description Prendo una lista e restituisco un oggetto con la lista completa con il proprio index
   */
  static getObjToList<T>(value: ReadonlyArray<T>): Record<number, T> {
    return {...value}
  }

  /**
   * Retrieves the class of a specific index in an object.
   *
   * @template T - The type of the object.
   * @param {T} value - The object to retrieve the class from.
   * @param {keyof T} index - The index of the desired class.
   * @return {T[keyof T]} - The class of the specified index in the object.
   */
  static getClassOfIndex<T>(value: T ,index: keyof T):T[keyof T] {
    return value[index]
  }

  /**
  * @description Questa funzione riceve due oggetti e verifica quale delle proprietà e stata modificata
   * @template T - The type of the object.
   * @param {T} first - Primo oggetto
   * @param {T} last - Secondo oggetto
   * @param {string} path - Path di riferimento
  */
  static deepCompare<T>(first:T, last: T, path: string = ''){

    let diffs: Array<string> = []
    // ordino le props degli oggetti
    const firstProps = Object.keys(first).sort() as Array<keyof T>;
    const lastProps = Object.keys(last).sort() as Array<keyof T>;

    // Concateno i due array e creo un set
    const propsSet = new Set([...firstProps, ...lastProps]);

    for (let propsSetKey of propsSet) {
      if (typeof first[propsSetKey] === "object" && first[propsSetKey] !== null && typeof last[propsSetKey] === "object" && last[propsSetKey] !== null) {
        diffs = diffs.concat(this.deepCompare(first[propsSetKey], last[propsSetKey], path ? `${path}.${propsSetKey}` : propsSetKey as string));
      } else if (first[propsSetKey] !== last[propsSetKey]) {
        diffs.push(path ? `${path}.${propsSetKey}` : propsSetKey as string);
      }
    }
    return diffs;
  }

  /**
   * @description Riceve due elenchi e ne restituisce uno solo con gli elementi unici.
   * @template T extend IParameter
   * @param {T[]} firstList - Il primo elenco da unire.
   * @param {T[]} lastList - Il secondo elenco da unire.
   * @return {T[]} Un array che contiene solo gli elementi unici dei due elenchi dati.
   *
   * @example
   *   const firstList = [{parametro: {key: 1}}, {parametro: {key: 2}}];
   *   const lastList = [{parametro: {key: 2}}, {parametro: {key: 3}}];
   *   const uniqueArray = UtilityClass.getUniqueArray(firstList, lastList);
   *   // uniqueArray sarà: [{parametro: {key: 1}}, {parametro: {key: 2}}, {parametro: {key: 3}}]
   */
  static getUniqueArray<T extends IParameter,K>(firstList:T[], lastList:T[]):T[] {
    let uniqueArray = [...firstList, ...lastList];
    return uniqueArray.filter((item, i, array) => array.findIndex(lastItem => lastItem.parametro.key === item.parametro.key) === i )
  }

  /**
   * @description Una funzione statica appartenente alla classe UtilityClass che prende in input due array di oggetti IParameter e restituisce un nuovo array contente gli oggetti presenti nel secondo array che non sono presenti nel primo.
   * @param storeList Array IParameter[] che rappresenta la lista di oggetti principale, o 'storage'.
   * @param lastList Array IParameter[] che rappresenta la lista di oggetti da confrontare con la `storeList`.
   * @return Array<IParameter> Un nuovo array di oggetti IParameter che contiene solo gli elementi presenti nel `lastList` che non sono presenti nel `storeList`.
   * @example
   * const storeList = [{ parametro: { key: 'chiave1' } }, { parametro: { key: 'chiave2' } }]
   * const lastList = [{ parametro: { key: 'chiave2' } }, { parametro: { key: 'chiave3' } }]
   * const result = UtilityClass.getElementToLastList(storeList, lastList)
   * console.log(result) // [{ parametro: { key: 'chiave3' }}]
   */
  static getElementToLastList(storeList: IParameter[], lastList: IParameter[]): Array<IParameter> {
    let newParameters: Array<IParameter> = [];
    lastList.forEach((item) => {
      if (!storeList.some((storeItem) => storeItem.parametro.key === item.parametro.key)) {
        newParameters.push(item);
      }
    });
    return newParameters
  }


  static getElementToList<T,K extends keyof T>(hold: T[], last: T[],key: K, keys:Array<K>): Array<T>{
    let newParameters: Array<T> = [];
    if (!Array.isArray(hold) && !Array.isArray(last)) {
      throw new Error('Una delle liste non è un Array');
    }
    if (hold.length !== last.length) {
      return newParameters;
    }
    last.forEach((item) => {
      if (hold.find(holdItem => holdItem[key] === item[key] && keys.some(k => holdItem[k] !== item[k]))) {
        newParameters.push(item);
      }
    });
    return newParameters
  }





  static formatObj<T, K extends keyof T, F extends keyof T[K]>(value: T, key: K, keys?: F):  T[K] | T[K][F]  {
    return !keys ? value[key] : value[key][keys]
  }
}

