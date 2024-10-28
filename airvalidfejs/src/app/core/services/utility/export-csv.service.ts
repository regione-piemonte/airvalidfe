/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from '@angular/core';
import IResponseReportistica from "@services/core/api/reportistica/models/getReportistica.model";
import {IFormatExport} from "@models/validazione";
import {IGraficiElaborazioni} from "@reducers/*";
import {DateSettingService, formatKeys} from "@services/core/utility/date-setting.service";
import {Table} from "@models/response/report.interface";
import {ro, ta} from "date-fns/locale";
import {replace} from "lodash";


declare global {
  interface Navigator {
    msSaveBlob?: (blob: any, defaultName?: string) => boolean
  }
}


@Injectable({
  providedIn: 'root'
})
export class ExportCsvService {

  constructor(
    private readonly dataSettingService: DateSettingService
  ) {
  }

  /**
   * Formats a given date format.
   *
   * @param {string} format - The desired format to be formatted.
   * @return {string} - The formatted date format.
   * @private
   */
  private _formatDate(format: string): string {
    let obj: Record<string, string> = {
      'DD/MM/YYYY HH:mm': 'dd/MM/yyyy HH:mm',
      'MM/DD/YYYY HH:mm': 'MM/dd/yyyy HH:mm',
      'YYYY-MM-DD HH:mm': 'yyyy-MM-dd HH:mm',
    };
    return obj[format];
  }

  exportToCsv(filename: string, rows: object[], separator: string) {
    if (!rows || !rows.length) {
      return;
    }
    //const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows.map((row: any) => {
        return keys.map(k => {
          let cell = row[k] === null || row[k] === undefined ? '' : row[k];
          cell = cell instanceof Date
            ? cell.toLocaleString()
            : cell.toString().replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(separator);
      }).join('\n');

    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, filename);
    } else {
      const link = document.createElement('a');
      if (link.download !== undefined) {

        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }


  createCsvElaborazione(nameFile: string, data: IResponseReportistica[], setting: IFormatExport, type: 'normal' | 'list' = 'normal') {

    // Verifico che ci siano dati nel grafico
    if (!data.length) {
      throw new Error('Nessun dato nel grafico');
    }

    // Estrapolo tutte le tabelle
    let listMap = data.map(grafico => grafico.listResult!).flat();
    // Creo le key delle tabelle
    let keys = '';


    listMap.forEach((tabella, i) => {
      // Nel caso che sia type 'normal' aggiungo il nome della tabella
      if (type === 'normal') {
        keys += tabella.name! + '\n\n';
      }

      let columnNames = Object.keys(tabella.values![0]);
      // Nel caso che sia type === 'list'
      if (type === 'list') {
        columnNames.splice(0, 0, 'parametro');
      }
      // Aggiungo la colonna 'ora' come secondo item nel caso di type 'normal', come terzo nel caso di 'list'
      columnNames.splice(type === 'normal' ? 1 : 2, 0, 'ora');
      if (type === 'normal' || (type === 'list' && i === 0)) {
        keys += columnNames
          .map(key => key !== 'timestamp' ? key.toUpperCase() : 'data'.toUpperCase()).join(setting.dataSeparator) + '\n';
      }

      keys += tabella.values?.map(({value, error, timestamp}) => {
        let [format, ora] = setting.dataFormat.split(' ');
        let {day, hours} = this.dataSettingService.generateDataAndHours(timestamp!, format.toUpperCase() as formatKeys, true);
        // Metto il separatore decimale sia al numero che all'errore
        let newValue = !!value ? replace(value.toString(),'.',setting.numberSeparator) : value;
        let newError = !!error ? replace(error.toString(),'.',setting.numberSeparator) : error;
        let csvRow = `${day}${setting.dataSeparator}${hours}${setting.dataSeparator}${newValue}${setting.dataSeparator}${newError}`;
        return type === 'normal' ? csvRow : `${tabella.name}${setting.dataSeparator}${csvRow}`;
      }).join('\n');
      keys += type === 'normal' ? '\n\n\n' : '\n';

    })

    // Creo il file
    let blob = new Blob([...keys], {type: 'text/csv;charset=utf-8;'});

    // Creo il link
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', nameFile);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

  }

  createFile(grafico: IGraficiElaborazioni, setting: IFormatExport) {
    // Creo il file cambio il formato della data
    setting = {
      ...setting,
      dataFormat: this._formatDate(setting.dataFormat)
    }

    this.createCsvElaborazione(`Elaborazione_${Date.now()}`, grafico.data, setting, setting.typeFormatCsv)

  }

  /**
   * Creates a report file in the specified format.
   *
   * @param {Table} table - The table object containing the data.
   * @param {IFormatExport} format - The format in which the report should be exported.
   */
  createReportFile(table: Table, format: IFormatExport) {

    format = {
      ...format,
      dataFormat: this._formatDate(format.dataFormat)
    };
    console.info(format);

    let csv = '';
    // Ricevo i dati della table
    let rowData = table.data.map(item => item.row).flat();
    // Prendo il title della table
    // let mainTitle = rowData.filter(item => item.titleLevel === 'L1' && !item.monospace).map(({value}) => value);
    // if (!!mainTitle.length) {
    // }
    let headerRow = table.data[0].row.map(item => item.value).join(format.dataSeparator);
    csv += headerRow + '\n';

    let mainValueTable = rowData.filter(item => item.titleLevel !== 'L1');
    table.data.forEach((item,index) => {
      if (index !== 0) {
        let rowData = item.row.map(row => {
          // Verifico che sia un numero
          if (!!row.value && !isNaN(+row.value)) {
            //   Nel caso che sia un numero allora cambio il separatore
            row = {
              ...row,
              value: row.value.replace('.', format.numberSeparator)
            }
          }
          return row.value
        }).join(format.dataSeparator);
        csv += `${rowData}\n`;
      }
    })

    // Creo un file csv
    let file = new Blob([csv], {type: 'text/csv;charset=utf-8;'});

    // Creo il link per lo scarico
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(file);
      link.setAttribute('href', url);
      let tableName = table.titleName;
      let headerValues = table.header && table.header.length ? table.header.map((header, index) => index <= 0 ? header.value : '').filter(header => !!header) : [];
      // Prendo l'header e tolgo gli spazi vuoti
      if (!tableName) {
        headerValues = headerValues.map(header => header.split(' ').join('_'));
        headerValues = headerValues.map(header => header.split('.').join('_'));
      }

      link.setAttribute('download', `${tableName ?? headerValues}_${Date.now()}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }


  }
}
