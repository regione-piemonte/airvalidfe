/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { createAction , props } from '@ngrx/store';
import {IGrafico, IOutput} from '@models/grafico';
import {IDataZoom, IGeneratePoint, PeriodType, ScaleEnum} from '@components/shared/grafico/compositive_grafic/models';
import { ObservableData } from '@models/dataService';


export type DataZoom = { start: number; end: number };
export type DataZoomBatch = { start: number; end: number; batch: Array<DataZoom>} ;
export const initGrafico = createAction( '[Grafico] Init Grafico' , props<{ grafici: Array<IGrafico>, periodo: PeriodType }>() );
export const selectGrafico = createAction( '[Grafico] Select Parametro' , props<{ parametro_selezionato: ObservableData }>() );
export const setPeriod = createAction( '[Grafico] Select Periodo' , ( value: PeriodType ) => ( { value } ) );

/**
* @description Action per ricaricare i dati originali
*/
export const reloadGrafico = createAction( '[Grafico] Reload Grafico' , ( value?: IGrafico ) => ( { value } ) );

/**
 * @description Action per il click sul punto specifico sul grafico
 *
 */
export const clickOnPoint = createAction( '[Grafico] Click on point' , ( value: Partial<IGeneratePoint>, index: number = 0, serie: number = 0 ) => ( { value, indexPoint: index, indexSerie: serie} ) );

/**
 * @description Action per il dataZoom per il movimento
 */
export const dataZoomAction = createAction( '[Grafico] Data Zoom Grafico' , props<{ start: number, end: number , batch: Array<DataZoom> }>() );

/**
 * @description Delete Parametro
 */
export const deleteGrafico = createAction( '[Grafico] Delete Parametro' , ( key: string ) => ( { key } ) );


/**
 * @description Acttion per chiamare la lista dei parametri per sensore
 */
export const getSensorDataAction = createAction( '[Grafico] Get Parametri' , props<{ startDate: string | number , endDate: string }>(  ) );

export const addGetSensorDataAction = createAction( '[Grafico] Add Get Parametri' , ( data: IGrafico[] ) => ( { data } ) );

/**
 * @description set date richiesta
 */
export const setDateGetSensorDataAction = createAction( '[Grafico] Set Date Richiesta' , props<{ startDate: string | number , endDate: string }>() );

/**
 * @description Resetto il punto selezionato
 */
export const resetOnPointGraficoAction = createAction( '[Grafico] Reset On Point' , (selezionato: boolean = false) => ({selezionato}));

/**
 * @description Prendo il valore dei punti dataZoom sull'instance grafico
 */
export const addDataZoomToInstance = createAction( '[Grafico] Add Data Zoom To Instance' , props<{ dataZoom: IDataZoom }>() );

/**
* @description Azione per segnalare il valore che dovremmo avere in tabella
*/
export const setTableValue = createAction( '[Grafico] Set Table Value' , props<{ input: Partial<IOutput> }>() );

/**
* @description Azione che rimane in ascolto del salvataggio del dettaglio
*/
export const saveSuccessGraficoAction = createAction( '[Grafico] Save Success e modifica dei valori del grafico' , props<{ grafici: Array<IGrafico> }>() );

/**
* @description Azione per la gestione della scala nel grafico
*/
export const setScaleGraficoAction = createAction( '[Grafico] Set Scale' , props<{ scale: ScaleEnum }>() );

export const addGraficoNascosto = createAction('[Grafico] Add key grafico da nascondere', (key:string) => ({key}));
