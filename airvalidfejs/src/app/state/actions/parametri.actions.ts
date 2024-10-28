/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { createAction , props } from '@ngrx/store';
import { IParameter , ObservableData } from '@models/dataService';
import {IGetStatusLock} from '@models/interface/BE/response/getLock';
import {ActionParametersType} from "@models/utils_type";
import {Parametri} from "@models/validazione";
import {IDataInitConfig} from "../../core/components/side-bar/side-bar.component";
import IGetEventsResponse from "@models/eventi/getEvents";

/**
 * @description Init dei parametri
 */
export const initParametroAction = createAction( '[Parametri] Init Parametri' , (parametri: Array<IParameter>, reload: boolean = false ) => ( { parametri , reload} ) );


export const setParametriAfterPollingParametroAction = createAction( '[Parametri] Set Parametri After Polling' , (parametri: Array<IParameter> ) => ( { parametri } ) );

/**
 * @description Seleziona un parametro
 */
export const selectParametroAction = createAction( '[Parametri] Select Parametro' , props<{ parametro_selezionato: ObservableData }>() );

export const deselezioneParametroAction = createAction('[Parametri] Deselezione parametro');

/**
 * @description Eliminazione di un parametro
 */
export const deleteParametroAction = createAction( '[Parametri] Delete Parametro' , (item: IParameter ) => ( { item } ) );

/**
 * Action to retrieve a lock parameter.
 *
 * @name getLockParametroAction
 * @constant
 *
 * @summary
 * Dispatches an action to get a lock parameter with the specified properties.
 *
 * @description
 * This Redux action is used to initiate the process of retrieving a lock parameter
 * using the provided properties which may include a partial IParameter and IGetStatusLock.
 *
 * @param {Partial<IParameter & IGetStatusLock>} item - An object containing a subset of IParameter and IGetStatusLock properties.
 */
export const getLockParametroAction = createAction( '[Parametri] Get Lock Parametro' , props<{item: Partial<IParameter & IGetStatusLock>}>()  );

/**
 * @description Errore nella ricerca di un parametro
 */
export const errorRicercaParametroAction = createAction( '[Parametri] Errore Ricerca Parametri' , (key: string , error: string ) => ( { key , error } ) );

/**
 * @description Dividiamo gli elementi in due liste, una per i parametri che possono essere modificati e una per quelli che non possono essere modificati
 * @param parametri
 *
 */
export const createListToIDataParametroAction = createAction( '[Parametri] Create List\'s WriteOrAdvanced and not' , (data: {
  writeOrAdvanced: Array<Parametri> ,
  notWriteOrAdvanced: Array<Parametri>
} ) => ( { data } ) );

export const deleteParametroToListsAction = createAction( '[Parametri] Delete Parametro To Lists' , (key: string ) => ( { key } ) );

/**
 * @description Rimaniamo in ascolto dell'azione selezionata
 */
export const selectParametroTypeAction = createAction( '[Parametri] Select Parametro Action' , ( action: ActionParametersType ) => ( { action } ) );

export const changeShowNotValidDataParametroAction = createAction( '[Parametri] Change Show Not Valid Data' , (showNotValidData: boolean ) => ( { showNotValidData } ) );

/**
* @description Cambio il valore delle proprietà dati originali visibili
*/
export const changeShowOriginalDataParametroAction = createAction( '[Parametri] Change Show Original Data' , (showOriginalData: boolean ) => ( { showOriginalData } ) );

export const notChangeParametroAction = createAction( '[Parametri] Not Change Action' );

/**
 * @description Richiamo la lista dei grafici per creare il csv
 */
export const saveCsv = createAction( '[Parametri] Save Csv'  );

/**
* @description Azione che viene chiamata quando dettaglio effettua un reload dei dati originali
*/
export const changeValoreParametroAction = createAction( '[Parametri] Reload Parametro' , (parametro_key: string ) => ( { parametro_key } ) );

/**
* @description Azione per la registrazione dei parametri aggiunti
*/
export const registrazioneParametroAction = createAction( '[Parametri] Registrazione Parametri' , props<{parametri: Array<IParameter>, reload: boolean, nuovoPeriodo?: IDataInitConfig}>() );

/**
* @description Azione per il reload Periodo
*/
export const reloadPeriodoParametroAction = createAction( '[Parametri] Reload Period', props<{reload:boolean, parametri: Array<IParameter>, data?: IDataInitConfig}>() );

/**
* @description Azione che specifica il momento in qui facciamo il polling dei dati
*/
export const pollingDataParametroAction = createAction( '[Parametri] Polling Data', (value: boolean) => ({value}) );

/**
* @description Azione per cambiare il valore del parametro selezionato
*/
export const changeValoriParametroSelezionatoParametroAction = createAction( '[Parametri] Change Valori Parametro Selezionato', (parametro: IParameter) => ({parametro}) );

/**
* @description Azione per eliminare tutti i parametri
*/
export const deleteAllParametroAction = createAction('[Parametri] Eliminazione di tutti i parametri')

export const eventiToParametroAction = createAction('[Parametri] Get Eventi To Parametro Selezionato', (eventi: Array<IGetEventsResponse> ) => ({ eventi}));

export const deleteParametroSelezionatoAction = createAction('[Parametri] Eliminazione Parametro Selezionato', (parametro:IParameter) => ({parametro}));

export const deleteParametriSelezionatiAction = createAction('[Parametri] Eliminazione dei parametri selezionati', (parametri:ReadonlyArray<IParameter>) => ({parametri}));

export const resetStateParametroAction = createAction('[Parametri] Reset State parametri State', (reset:boolean) => ({reset}));

export const deleteLockToParametroAction = createAction('[Parametri] Delete Lock', (parametro:IParameter) => ({parametro}));

