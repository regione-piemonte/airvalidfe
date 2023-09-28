/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
export interface IDettaglioReg {
  listSensorId: string[]
  timeUnit: string
  beginTime: number
  endTime: number
  activityType: string
  activityOptions: string
}
