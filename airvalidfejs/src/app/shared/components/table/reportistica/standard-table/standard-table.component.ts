import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Table, Datum, Header } from '@models/response/report.interface';

@Component({
  selector: 'app-standard-table',
  templateUrl: './standard-table.component.html',
  styleUrls: ['./standard-table.component.scss'],
})
export class StandardTableComponent implements OnInit, OnChanges {
  @Input() data$!: Table;
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  displayedColumns: string[] = [];
  displayedColumnNames: string[] = [];
  tableTitle: string | null = null;
  isSideHeader: boolean = false;

  constructor() {}

  ngOnInit(): void {
    this.initializeTable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data$']) {
      this.initializeTable();
    }
  }

  private initializeTable(): void {
    if (this.data$ && this.data$.data.length > 0) {
      const columnsSet = new Set<string>();
      this.tableTitle = this.data$.titleName;

      // Determina se l'intestazione deve essere laterale -- codice commentato al fondo vedi shouldUseSideHeader()
      // this.isSideHeader = this.shouldUseSideHeader(this.data$.header);
      this.isSideHeader = false;

      // Estrazione dati per l'intestazione delle colonne
      this.displayedColumns = [];
      this.displayedColumnNames = [];
      if (!this.isSideHeader) {
        this.data$.data[0].row.forEach((cell, index) => {
          let columnName = cell.value;
          // Nomi colonne se sono uguali non vengono stampate da material allora
          // c'è un id che li identifica
          let uniqueColumnName = columnName;
          let counter = 1;
          while (columnsSet.has(uniqueColumnName)) {
            uniqueColumnName = `${columnName}_${counter}`;
            counter++;
          }
          columnsSet.add(uniqueColumnName);
          this.displayedColumns.push(uniqueColumnName);
          this.displayedColumnNames.push(columnName);
        });

        // Preparazione dati per la tabella ignorando la prima riga perchè sarebbe l'intestazione
        const tableDataRows = this.data$.data.slice(1).map((dataRow: Datum) => {
          const row: any = {};
          dataRow.row.forEach((cell, index) => {
            const column = this.displayedColumns[index];
            if (column) {
              row[column] = cell; // Passa tutto l'oggetto cell
            }
          });
          return row;
        });
        this.dataSource = new MatTableDataSource(tableDataRows);
      } else {

        // questo codice non viene utilizato al momento perchè tutte le tabelle di sintesi hanno un'intestazione
        const tableDataRows: any[] = [];

        this.data$.data.forEach(row => {
          let sideHeader: any = null;
          const rowData: { [key: string]: any } = {};

          // La prima cella è l'intestazione laterale
          if (row.row.length > 0) {
            sideHeader = row.row[0];
            rowData['sideHeader'] = sideHeader; // Usa un identificatore specifico per l'intestazione laterale
          }

          // Le altre celle sono i dati della riga
          row.row.slice(1).forEach((cell, index) => {
            rowData[`column${index}`] = cell; // Passa tutto l'oggetto cell
          });

          // Aggiungi i dati della riga solo se ci sono dati da aggiungere
          if (Object.keys(rowData).length > 0) {
            tableDataRows.push(rowData);
          }
        });

        // Aggiungi le colonne solo una volta
        if (tableDataRows.length > 0) {
          this.displayedColumns.push('sideHeader');
          this.displayedColumnNames.push('Intestazione Laterale');

          const maxColumns = Math.max(...tableDataRows.map(row => Object.keys(row).length)) - 1;
          for (let i = 0; i < maxColumns; i++) {
            const columnName = `column${i}`;
            this.displayedColumns.push(columnName);
            this.displayedColumnNames.push(`Colonna ${i + 1}`);
          }

          this.dataSource = new MatTableDataSource(tableDataRows);
        }
      }
    }
  }

  // il codice è commentato perchè serviva per la creazione di tabelle con header laterale
  private shouldUseSideHeader(header: Header[]): boolean {
    if (header) {
      return header.some(h => h.value.includes('Synth') && h.value !== 'HoursMediumSyntheticTable');
    }
    return false
  }
}
