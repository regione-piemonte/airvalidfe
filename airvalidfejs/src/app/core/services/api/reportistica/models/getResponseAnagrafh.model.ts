/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
export interface Option {
  id: string;
  name: string;
  description: string;
  type: string;
  values: {
    final: string;
    nome: string;
    preliminary: string;
  };
}

export interface TimePeriod {
  timeUnit: string;
  countMin: number;
  countMax: number | null;
  sparse: boolean;
}

export interface IResponseAnagragh {
  anagraphRequired: boolean;
  timePeriod: TimePeriod;
  options: Option[];
}
