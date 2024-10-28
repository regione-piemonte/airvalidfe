/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {createReducer, on} from '@ngrx/store';
import {initDialogConfig} from '../index';
import {
  addParameterAction,
  changeLavoroAction, changePeriodAction,
  deleteDialogParameterAction,
  dialogSetPeriodAction,
  initDialogAction,
  initDialogParameterAction, IPropsChangeLavoro,
  nextLavoroAction,
  saveDialogParameterAction,
  selectPeriodAction, setDateStoreAction
} from "@actions/*";


export interface ISelectPeriodoState {
  periodo?: IPropsChangeLavoro;
  lavoro?: string;
  tipo_periodo?: string;
  next?: boolean;
  changePeriod?: boolean;
}


export const dialogReducer = createReducer(
  initDialogConfig,
  on(initDialogAction, (state) => ({...state})),
  on(initDialogParameterAction, (state) => ({...state})),
  on(nextLavoroAction, (state,{lavoro}) => ({...state, dialogConfig: {...state.dialogConfig, next: true,lavoro}})),
  on(changeLavoroAction, (state, {lavoro, dataFine, dataInizio, dataInizioTime, dataFineTime}) => ({
    ...state,
    dialogConfig: {
      ...state.dialogConfig,
      lavoro,
      periodo: {
        dataInizio,
        dataFine,
        dataFineTime,
        dataInizioTime
      }
    }
  })),
  on(dialogSetPeriodAction, (state, {periodo}) => ({
    ...state,
    dialogConfig: {
      ...state.dialogConfig,
      tipo_periodo: periodo
    }

  })),

  on(selectPeriodAction, (state, {dataInizio, dataFine}) => ({
    ...state,
    dialogConfig: {
      ...state.dialogConfig,
      periodo: {
        dataInizio,
        dataFine
      }
    }
  })),
  on(addParameterAction, (state, {parameters}) => ({
    ...state,
    dialogParameter: {
      ...state.dialogParameter!,
      dataAdd: undefined
    }
  })),

  on(deleteDialogParameterAction, (state, {parametro}) => ({
    ...state,
    dialogParameter: {
      ...state.dialogParameter!,
      data: {
        ...state.dialogParameter!.data,
        all: [],
        selected: {
          ...state.dialogParameter!.data.selected,
          parametri: [...state.dialogParameter!.data.selected.parametri.filter(item => item.key !== parametro.parametro.key)],
          areeTerritoriali: [...state.dialogParameter!.data.selected.areeTerritoriali.filter(item => item.key !== parametro.area.key)],
          stazioni: [...state.dialogParameter!.data.selected.stazioni.filter(item => item.key !== parametro.stazione.key)],
          status: [...state.dialogParameter!.data.selected.status!.filter(item => item.statusLock.measurementId !== parametro.parametro.key)],
        }
      }
    }
  })),

  on(saveDialogParameterAction, (state, {data}) => ({
      ...state,
      dialogParameter: {
        ...state.dialogParameter!,
        data:{
          all:[],
          selected: data.selected
        }
      }
    })
  ),

  on(setDateStoreAction, (state, {key, value}) => ({
    ...state,
    dialogConfig: {
      ...state.dialogConfig,
      periodo: {
        ...state.dialogConfig!.periodo!,
        [key]: value
      }
    }
  })),
  on(changePeriodAction, (state, {value}) => ({
      ...state,
      dialogConfig: {
        ...state.dialogConfig,
        changePeriod: value
      }
    })
  ),
)
