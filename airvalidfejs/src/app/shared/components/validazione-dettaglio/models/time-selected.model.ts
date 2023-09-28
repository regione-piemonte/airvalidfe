/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
export interface ITimeSelected {
  timestamp: number
  valore_validato: number
  id_aggregazione: number
  valore_originale: number
  tipologia_validaz: string
  flag_validaz_autom: string
  validity_flag: number
  verification_flag: number
  da_rivedere: any
  data_agg: number
  changed: boolean
}
