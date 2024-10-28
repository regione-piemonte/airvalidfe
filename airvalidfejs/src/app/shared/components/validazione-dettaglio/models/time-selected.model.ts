/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Dataset, IOutput} from "@models/grafico";

export interface ITimeSelected {
  timestamp: number;
  valore_validato: number;
  id_aggregazione: number;
  valore_originale: number;
  tipologia_validaz: string;
  flag_validaz_autom: string;
  validity_flag: number;
  verification_flag: number;
  da_rivedere: any;
  data_agg: number;
  changed: boolean;
  index?: number;
  timeFormat?: string;
  timeFormatUTC?: string;
}

export type IRequestDataSet = Omit<ITimeSelected, 'changed' | 'index' | 'timeFormat'>;

export interface IValueDataOutput {
  indice: number;
  value: ITimeSelected;
  input: Partial<IOutput>;
}
export interface IPaginaTabella {
  index: number;
  length: number;
  pageSize: number;
}

export interface IDataSetReducer {
  valori_pagina_tabella: Dataset[];
  pagina_tabella: IPaginaTabella;
  dataSet_changed: ReadonlyArray<Dataset>;
}
