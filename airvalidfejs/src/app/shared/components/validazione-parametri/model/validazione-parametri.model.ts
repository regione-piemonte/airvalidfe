/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
export interface IProsElement {
  locked: boolean;
  virtual: boolean;
  extraInfo: string;
  key: string;
}

export interface INameColor {
  name: string;
  color: string;
}
