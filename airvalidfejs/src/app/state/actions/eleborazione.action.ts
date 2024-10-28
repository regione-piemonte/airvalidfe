/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {createAction} from "@ngrx/store";
import {ItemSearchType, UserStateLock} from "@services/core/api";
import {IDateToService, IGraficiElaborazioni, TypeSelectReport} from "../reducer";
import {IParameter} from "@models/dataService";
import IResponseReportistica from "@services/core/api/reportistica/models/getReportistica.model";
import {TimePeriod} from "@services/core/api/reportistica/models/getResponseAnagrafh.model";
import {IFormYears} from "@components/shared/dialogs/dialog-init-config/specilistico-form/specialistico-form.component";
import {IResponseItems, Item} from "@services/core/api/reportistica/models/getResponseItem.model";


export interface IFormElaborazione {
  lavoro: string;
  startDate: string;
  endDate: string;
  tipoElaborazione: string;
  tipoGrafico: string;
}

export const resetStoreElaborazioneSpecialistico = createAction('[Elaborazione] Reset state specialistico');

export const setDBElaborazioneAction = createAction('[Elaborazione] Set DB', (db: UserStateLock) => ({db}));

export const selectReportToCloseDialogElaborazioniAction = createAction('[Elaborazione] Select Report To Close Dialog', (report: TypeSelectReport) => ({report}));

export const addElaborazioneSelectionAction = createAction('[Elaborazione] Scelta del tipo elaborazione', (form: IFormElaborazione) => ({form}));

export const addElaborazioneSpecialisticaAction = createAction('[Elaborazione] Scelta tipo specialistico', (form:IFormElaborazione) => ({form}));

export const addGraficoElaborazioneAction = createAction('[Elaborazione] Aggiungo il grafico alla lista', (value: string, indexTime: number) => ({value, indexTime}));

export const addParametriElaborazioniAction = createAction('[Elaborazione] Add parametri Elaborazione', (parametri: Array<IParameter>) => ({parametri}));

export const selectGraphicElaborazioniAction = createAction('[Elaborazione] Selezione Tipo Grafico', (grafico: string) => ({grafico}));

export const setDataToGraficiElaborazioneAction = createAction('[Elaborazione] Add TimeStamp To Grafici', (timesstamps: Array<IResponseReportistica>) => ({timesstamps}));

export const setTypeGraficoElaborazioneAction = createAction('[Elaborazione] Change Type Grafico', (tipo: string, valoreFlag: number) => ({tipo, valoreFlag}));

export const attivoGraficoElaborazioneAction = createAction('[Elaborazione] Change Grafico Attivo', (index: number) => ({index}));

export const setPeriodoElaborazioneAction = createAction('[Elaborazione] Change Periodo Elaborazione', (body: IFormElaborazione) => ({body}));

export const setDataGraficiElaborazioneAction = createAction('[Elaborazione] Change Data Grafico Elaborazione', (data: IResponseReportistica, index: number) => ({data, index}))

export const resetStateElaborazione = createAction('[Elaborazione] Set State Elaborazione');

export const deleteParametriElaborazioneAction = createAction('[Elaborazione] Delete parametri', (parametri: Array<IParameter>) => ({parametri}));

export const deleteParametroElaborazioneAction = createAction('[Elaborazione] Delete single parametro', ({store, grafici, indexDettaglio}: {
  store: Array<IParameter>,
  grafici: Array<IGraficiElaborazioni>,
  indexDettaglio: string | undefined
}) => ({store, grafici, indexDettaglio}));

export const deleteParametriToGrafico = createAction('[Elaborazione] Delete parametro to grafico', (grafici: Array<IGraficiElaborazioni>) => ({grafici}));

export const visibilityElaborazioneAction = createAction('[Elaborazione] Parametri non visibili sul grafico', (parametri: Array<IParameter>) => ({parametri}));

export const selectParametroElaborazioneAction = createAction('[Elaborazione] Parametro Selezionato', (parametro: IParameter) => ({parametro}));

export const removeGraficoElaborazioniAction = createAction('[Elaborazione] Remove Grafico to list', (index: number) => ({index}));

export const deleteGraficoElaborazioniAction = createAction('[Elaborazione] Delete Grafico', (indexTime: number) => ({indexTime}));

export const activateGraficoElaborazioneAction = createAction('[Elaborazione] Activate grafico', (indexTime: number) => ({indexTime}));

export const changeValoreFlagVerificationLevel = createAction('[Elaborazione] Change valore verification flag', ({indice, valore}: { indice: number, valore: number }) => ({indice, valore}));

export const selectTableDettaglioElaborazioneAction = createAction('[Elaborazione] Selezione del dettaglio', (index: string) => ({index}));

export const addNewParameterToListElaborazioneAction = createAction('[Elaborazione] Aggiunta di nuovi paramatri alla lista', (parametri: IParameter[]) => ({parametri}));

export const addNewTimeToListGraficiElaborazioneAction = createAction('[Elaborazione] Aggiunta di nuovi time alla lista presente', (grafici: IGraficiElaborazioni[]) => ({grafici}));

export const callParametroCorrelatoElaborazioneAction = createAction('[Elaborazione] Aggiunta parametro correlato', (key: string) => ({key}));

export const deleteParametroToMenuElaborazioniAction = createAction('[Elaborazione] Elimina parametro da menu', (parametro: IParameter) => ({parametro}));

export const selectReteSpecialisticaElaborazioneAction = createAction('[Elaborazione] Selezione delle reti Specialistiche', (reti: string[]) => ({reti}));

export const selectStazioneSpecialisticaElaborazioneAction = createAction('[Elaborazione] Selezione delle stazioni Specialistiche', (stazioni: string[], complete: boolean) => ({stazioni, complete}));

export const selectSensorsSpecialisticaElaborazioneAction = createAction('[Elaborazione] Selezione dei sensori Specialistiche', (sensori: string[], tipo?: ItemSearchType) => ({sensori, tipo}));

export const selectParametersSpecialisticaElaborazione = createAction('[Elaborazione] Selezione dei parametri Specialistiche', (parametri: string[], tipo?: ItemSearchType) => ({parametri, tipo}));

export const selectReportSpecialisticoElaborazioneAction = createAction('[Elaborazione] Selezione del report specialistico', (id_report:string) => ({id_report}));

export const saveReportIdSpecialisticoElaborazioneAction = createAction('[Elaborazione] Save dell\'id del report specialistico', (id:string, time: TimePeriod) => ({id, time}));

export const saveYearsToSpecialisticoElaborazioneAction = createAction('[Elaborazione] Save years to report', (anni:IFormYears) => ({anni}));

export const successAnagraphElaborazionieAction = createAction('[Elaborazione] Success get anagraph', (response:IResponseItems) => ({response}));

export const successGetParametersElaborazioneAction = createAction('[Elaborazione] Success get Parameters', (response:IResponseItems) => ({response}));

export const seccessStationElaborazioniAction = createAction('[Elaborazioni] Success get Station', (response:IResponseItems) => ({response}));

export const successSensorElaborazioniAction = createAction('[Elabarazioni] Success get Parametri', (response:IResponseItems) => ({response}));

export const selectedDateElaborazioneAction = createAction('[Elaborazione] Save date', (date: IDateToService) => ({date}));
