/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { createAction , props } from '@ngrx/store';
import {Dataset, IGrafico, IOutput, Parametro} from '@models/grafico';
import { IGeneratePoint } from '@components/shared/grafico/compositive_grafic/models';
import {
  IDataSetReducer,
  ITimeSelected
} from '@components/shared/validazione-dettaglio/models/time-selected.model';
import {IParameter} from "@models/dataService";
import {TypeSelectorInput} from "@models/utils_type";

export const initDettaglio = createAction( '[Dettaglio] Init Dettaglio' , props<{ valori_grafico: Array<Dataset>, input: Partial<IOutput> }>() );

/**
 * @description Action per settare i valori del dettaglio
 */
export const setDettaglioAction = createAction( '[Dettaglio] Set Dettaglio' , props<{ valori_grafico: Array<Dataset>, input: Partial<IOutput> }>() );

/**
 * @description Action per il click sul punto specifico sul grafico aggiungendo in coda il valore
 */
export const addOnPoint = createAction( '[Dettaglio] add on point' , (value: Partial<IGeneratePoint>) => ({value}) );

/**
 * @description Azzera la lista dei point selezionati
 */
export const resetPointActionDettaglio = createAction( '[Dettaglio] Reset Point' );

/**
 * @description Select point dalla tabella
 */
export const selectPointDettaglio = createAction( '[Dettaglio] Select Point' , (value: ITimeSelected) => ({value}) );

/**
 * @description Setta lista dei dataset
 */
export const setDataSet = createAction( '[Dettaglio] Set Dataset' , (value: Array<IGrafico>) => ({value: value.filter(({name}) => !name.includes('origin') )}) );

/**
 * @description Ricarica i dati originali
 */
export const reloadDettaglioDettaglioAction = createAction( '[Dettaglio] Reload Dettaglio', ({parametro}: Partial<IParameter>) => ({parametro_key: parametro!.key, period_m: parametro!.measurementPeriod, parametro}) );

/**
* @description Azione che prende i valori originali dal server
*/
export const setValoriGrafico = createAction( '[Dettaglio] Set Valori Grafico' , props<{dataset:Array<Dataset>, parametro: Parametro}>() );

/**
 * @description Dopo l'eliminazione del parametro verifico che sia lo stesso nel dettaglio, nel caso lo elimino
 */
export const deleteDettaglioToListsDettaglioAction = createAction( '[Dettaglio] Delete Parametro To Lists' , (parametro: Partial<IOutput>,parametroEliminato: IParameter, selezionato: boolean) => ({parametro, selezionato, parametroEliminato}) );

/**
* @description Marca i valori che sono stati modificati
*/
export const setValoriTabellaDettaglioAction = createAction( '[Dettaglio] Set Changed' , (value: IDataSetReducer) => ({value}) );

/**
* @description Ripulisce il dettaglio dei valori modificati
*/
export const setValueChangedDettaglioAction = createAction( '[Dettaglio] Set Value To SetValue Changed', (value: IDataSetReducer[]) => ({value}) );

/**
* @description Azione che modifica il dataset nel input presente in dettaglio->input->changedDataset
 * nel caso che non ci sia lo crea dal dataset originale
*/
export const setDataSetChangedDettaglioAction = createAction( '[Dettaglio] Set Dataset Changed', (value: ReadonlyArray<Dataset>) => ({value}) );


/**
* @description Azione del dettaglio per eliminare il dataset dalla lissa
*/
export const deleteDatasetDettaglioAction = createAction( '[Dettaglio] Delete Dataset', (value: Dataset) => ({value}) );

/**
* @description Azione che segnala la modifica del dataset
*/
export const setInputChangedDettaglioAction = createAction( '[Dettaglio] Set Input Changed', (input: Partial<IOutput>) => ({input}) );

/**
* @description Scrive i valori massivi che mandiamo al grafico per farlo cambiare
*/
export const sendChangeMassivoDettaglioAction = createAction( '[Dettaglio] Send Change Massivo', (value: Dataset[]) => ({value}) );

/**
* @description Azione per indicare che il salvataggio è avvenuto con successo
*/
export const saveSuccessDettaglioAction = createAction( '[Dettaglio] Save Success', (value: Partial<IOutput>) => ({input:value}) );

/**
* @description Cambio il valore del dataset con quello salvato
*/
export const changeDatasetDettaglioAction = createAction( '[Dettaglio] Change lista dei grafici su dettaglio', (value: Array<IGrafico>, valori_grafico: Array<Dataset>) => ({value, valori_grafico}) );

/**
* @description Azione che ascolta il polling quando cambia
*/
export const hasPollingAction = createAction( '[Dettaglio] Has Polling', (value: boolean, input?: TypeSelectorInput) => ({value, input}) );

/**
* @description Azione che dopo il polling cambia il dataset e l'inout del dettaglio
*/
export const changeValoriDettaglioAction = createAction( '[Dettaglio] Change Dataset And Input', );

export const initStateDettaglioAction = createAction('[Dettaglio] Change Dettaglio to Init');
