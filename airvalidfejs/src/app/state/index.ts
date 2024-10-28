/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {IDettaglioState, IElaborazioneState, IGraficoState, IParametriState, IReportisticaState, ISelectPeriodoState, ISpecialisticoState} from './reducer';
import {ScaleEnum} from "@components/shared/grafico/compositive_grafic/models";
import {IData} from "@models/validazione";
import {Action, ActionReducer} from "@ngrx/store";
import { IResponseLockWithName} from "@models/interface/BE/response/getLock";
import {ITaratura} from "@models/grafico";

export interface IDialogParameter {
  data: IData;
  dataAdd?: IData;
}

export interface IDialog {
  dialogConfig?: ISelectPeriodoState;
  dialogParameter?: IDialogParameter;
}

export interface IResponseLimiti {
  id_parametro: string;
  allarme: string;
  attenzione: string;
}

interface IStateValidazione {
  stateLock: Array<IResponseLockWithName>;
  changes: Array<IResponseLockWithName>;
  limiti: Array<IResponseLimiti>
}

export interface AppState {
  validazione: IStateValidazione;
  idTab: number;
  grafico: IGraficoState;
  dialog: IDialog,
  parametri: IParametriState;
  dettaglio: IDettaglioState;
  reportistica: IReportisticaState;
  elaborazione: IElaborazioneState;
  taratura: IStateTarature;
}

export const initValueStateParametri: IParametriState = {
  parametri: undefined,
  parametro_selezionato: undefined,
  parametro_eliminato: undefined,
  showNotValidData: false,
  showOriginalData: false,
  pollingParametri: false,
  eventiToParametro: [],
  reset: false
}

export const initValueStateGrafici: IGraficoState = {
  grafici: [],
  scalaGrafico: ScaleEnum.assoluta,
  listaGraficiNascosti: []
}

export const initValueDettaglioState: IDettaglioState = {
  valori_grafico: [],
  points: [],
  dataset: [],
  dettaglio_da_ricaricare: '',
}

export const initValueStateReportistica: IReportisticaState = {
  db: 'cop',
  parametri: undefined,
  periodo: undefined,
  periodoDialog: {
    dataInizio: '',
    dataFine: ''
  },
}

export const initSpecialisticoState: ISpecialisticoState = {
  idReport: undefined
}

export const initElaborazioneState: IElaborazioneState = {
  db: 'cop',
  select_report: undefined,
  selezioneElaborazione: undefined,
  parametri: [],
  tipiGrafici: [],
  parametriVisibility: [],
  parametroVisibility: undefined,
  indexDettaglio: undefined,
  specialistico: initSpecialisticoState,
  progressReport: 0
}

export const initialStateValidazione: IStateValidazione = {
  stateLock: [],
  changes: [],
  limiti: []
}


export type TipoTarature = 'constant' | 'progressive';

interface IStateTarature {
  tipoTarature: TipoTarature;
  tarature: Array<ITaratura>
}

export const initialStateTarature: IStateTarature = {
  tipoTarature: 'constant',
  tarature: []
}

export const initialState: AppState = {
  idTab: Date.now(),
  grafico: initValueStateGrafici,
  dialog: {},
  parametri: initValueStateParametri,
  dettaglio: initValueDettaglioState,
  reportistica: initValueStateReportistica,
  elaborazione: initElaborazioneState,
  validazione: initialStateValidazione,
  taratura: initialStateTarature
}

export const initStateIdTab = initialState.idTab;

export const initStateLockValidazione = initialState.validazione

export const initStateGrafico = initialState.grafico;
export const initDialogConfig = initialState.dialog;
export const initStateParametri = initialState.parametri;
export const initStateDettaglio = initialState.dettaglio;

export const initStateReportistica = initialState.reportistica;

export const initStateElaborazione = initialState.elaborazione;

export const resetStateActionState = (reducer: ActionReducer<AppState>): ActionReducer<any> => {
  return function (state: AppState, action: Action){
    if (action.type === '[Parametri] Eliminazione di tutti i parametri'){
      return reducer({...state, grafico: initValueStateGrafici, parametri: initValueStateParametri, dettaglio: initValueDettaglioState,dialog:{...state.dialog, dialogParameter:undefined}}, action);
    }
    // console.info('state', state);
    // console.info('action', action);
    return reducer(state, action);
  }
}
