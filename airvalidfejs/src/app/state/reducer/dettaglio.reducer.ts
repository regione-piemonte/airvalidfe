/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {createReducer, on} from '@ngrx/store';
import {initStateDettaglio, initValueDettaglioState} from '../index';
import {Dataset, IGrafico, IOutput} from '@models/grafico';
import {
  addOnPoint,
  changeDatasetDettaglioAction, changeValoriDettaglioAction,
  deleteDettaglioToListsDettaglioAction, hasPollingAction,
  initDettaglio, initStateDettaglioAction,
  reloadDettaglioDettaglioAction,
  resetPointActionDettaglio,
  saveSuccessDettaglioAction,
  selectPointDettaglio,
  sendChangeMassivoDettaglioAction,
  setDataSet,
  setDataSetChangedDettaglioAction,
  setDettaglioAction,
  setInputChangedDettaglioAction,
  setValoriGrafico,
  setValoriTabellaDettaglioAction,
  setValueChangedDettaglioAction
} from '../actions';
import {IGeneratePoint} from '@components/shared/grafico/compositive_grafic/models';
import {IDataSetReducer} from "@components/shared/validazione-dettaglio/models/time-selected.model";

export interface IDettaglioState {
  valori_grafico: Array<Dataset>;
  input?: Partial<IOutput>;
  points: Array<Partial<IGeneratePoint>>;
  dataset: Array<IGrafico>;
  dettaglio_da_ricaricare: string;
  setValue?: IDataSetReducer[];
  cambioMassivo?: Dataset[];
  pollingParametri?: {
    polling: boolean;
    input?: Partial<IOutput>;
  };
}


export const dettaglioReducer = createReducer(
  initStateDettaglio,
  on(initDettaglio, (state, {valori_grafico, input}) => ({
    ...state,
    valori_grafico,
    input
  })),
  on(setDettaglioAction, (state, {valori_grafico, input}) => ({
    ...state,
    valori_grafico,
    input
  })),
  on(setValoriGrafico, (state, {parametro, dataset: valori_grafico,}) => ({
    ...state,
    valori_grafico,
    cambioMassivo: undefined
  })),
  on(addOnPoint, (state: IDettaglioState, {value}) => ({
      ...state,
      points: state.points.find(item => item.index === value.index) ? [...state.points.filter(item => item.index !== value.index)] : [...state.points, value]
    }
  )),
  on(selectPointDettaglio, (state, {value}) => ({
    ...state,
  })),
  on(setValoriTabellaDettaglioAction, (state, {value}) => ({
    ...state,
    setValue: [...state.setValue ?? [], value]
  })),
  on(setDataSetChangedDettaglioAction, (state, {value}) => ({
    ...state,
    input: {
      ...state.input,
      changedDataset: [...value]
    }
  })),

  on(setDataSet, (state, {value}) => ({
    ...state,
    dataset: value
  })),
  on(reloadDettaglioDettaglioAction, (state, {parametro_key}) => ({
    ...state,
    valori_grafico: [],
    input: {
      ...state.input,
      changedDataset: undefined,
    },
    dettaglio_da_ricaricare: parametro_key,

  })),
  on(deleteDettaglioToListsDettaglioAction, (state, {parametro, selezionato, parametroEliminato}) => (
    !!selezionato ? {
      ...state,
      input: undefined,
      dataset: [...state.dataset.filter(item => item.parametro.key !== parametro.parameter?.parametro?.key)],
      valori_grafico: [],
      points: [],
      cambioMassivo: undefined,
    } : {
      ...state,
      dataset: [...state.dataset.filter(item => item.parametro.key !== parametroEliminato.parametro.key)]
    })
  ),
  on(setValueChangedDettaglioAction, (state, {value}) => ({
    ...state,
    setValue: value
  })),
  on(resetPointActionDettaglio, (state) => ({
      ...state,
      points: []
    }
  )),
  on(setInputChangedDettaglioAction, (state, {input}) => ({
      ...state,
      input: {
        ...state.input,
        ...input
      }
    }
  )),
  on(sendChangeMassivoDettaglioAction, (state, {value: cambioMassivo}) => ({
    ...state,
    cambioMassivo
  })),
  on(saveSuccessDettaglioAction, (state) => ({
    ...state,
    cambioMassivo: undefined,
    input: undefined,
  })),
  on(hasPollingAction, (state, {value, input}) => ({
    ...state,
    pollingParametri: {
      polling: value,
      input
    }
  })),
  on(changeDatasetDettaglioAction, (state, {value: dataset, valori_grafico}) => ({
    ...state,
    dataset,
    valori_grafico,
    cambioMassivo: undefined,
    points: [],
    dettaglio_da_ricaricare: '',
  })),
  on(changeValoriDettaglioAction, (state) => ({
      ...state,
    cambioMassivo: undefined,
    })),
  on(initStateDettaglioAction, (state, ) => ({
    ...initValueDettaglioState
  }))
);

