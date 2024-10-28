/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
export interface IRowReport {
  key: string;
  value: Value[];
}

export interface Value {
  report: Report[];
  time: number;
  formato: string;
  periodo: Periodo;
}

export interface Periodo {
  lavoro: string;
  tipoElaborazione: string;
  tipoGrafico: string;
  dataInizio: Date;
  dataFine: Date;
  dataInizioTime: string;
  dataFineTime: string;
}

export interface Report {
  data: Datum[];
  parametro: string;
  totData: number;
}

export interface Datum {
  timestamp: number;
  valore_validato: number | null;
}
