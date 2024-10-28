/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {createAction, props} from "@ngrx/store";
import {IData} from "@models/validazione";
import {IParameter} from "@models/dataService";
import {UserStateLock} from "@services/core/api";
import {IFormToStandard} from "@components/shared/dialogs/reportistica-standard/model/standard.model";

export const initDialogAction = createAction( '[Dialog] Init Dialog' );

export interface IPropsChangeLavoro {
  lavoro?: string;
  dataInizio: string;
  dataFine: string;
  dataInizioTime?: string;
  dataFineTime?: string;
  tipoElaborazione?: string;
  standard?: IFormToStandard;
}

export const changeLavoroAction = createAction( '[Dialog] Change Lavoro' , props<IPropsChangeLavoro>() );
export const dialogSetPeriodAction = createAction( '[Dialog] SetPeriod' , props<{ periodo: string }>() );
export const nextLavoroAction = createAction( '[Dialog] Next Lavoro', props<{lavoro: string}>() );
export const selectPeriodAction = createAction( '[Dialog] Select Periodo' , props<{ dataInizio: string; dataFine: string }>() );
export const initDialogParameterAction = createAction( '[Dialog] Init Dialog Parameter' );

/**
 * @description Riceve i parametri dal dialog e li passa al effects per filtrare e metterli nel dataset
 * dei parametri
 */
export const addParameterAction = createAction( '[Dialog] Add Parameter and filter' , props<{ parameters: IData }>() );
export const saveDialogParameterAction = createAction( '[Dialog] Save dialog Parameter' , props<{ data: IData }>() );
export const deleteDialogParameterAction = createAction( '[Dialog] Delete dialog Parameter' , (parametro:IParameter) => ({parametro}) );

/**
* @description Setto il valore del DB
*/
export const setDBDialogAction = createAction( '[Dialog] Set DB' ,(db: UserStateLock) => ({db}) );

/**
* @description Azione per il cambia periodo
*/
export const changePeriodAction = createAction( '[Dialog] Change Period' ,(value: boolean) => ({value}) );

export const setDateStoreAction = createAction('[Dialog] Change data store' , (key: keyof IPropsChangeLavoro, value: string) => ({key, value}))
