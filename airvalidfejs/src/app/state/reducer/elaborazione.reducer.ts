/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {ItemSearchType, UserStateLock} from "@services/core/api";
import {createReducer, on} from "@ngrx/store";
import {
  activateGraficoElaborazioneAction,
  addElaborazioneSelectionAction,
  addGraficoElaborazioneAction,
  addNewParameterToListElaborazioneAction,
  addNewTimeToListGraficiElaborazioneAction,
  addParametriElaborazioniAction, addProgressReportisticaAction,
  attivoGraficoElaborazioneAction,
  deleteParametriToGrafico,
  deleteParametroElaborazioneAction,
  deleteSpecialisticoAction,
  IFormElaborazione,
  removeGraficoElaborazioniAction,
  resetStateElaborazione,
  resetStoreElaborazioneSpecialistico,
  saveReportIdSpecialisticoElaborazioneAction,
  saveYearsToSpecialisticoElaborazioneAction,
  seccessStationElaborazioniAction,
  selectedDateElaborazioneAction,
  selectParametroElaborazioneAction,
  selectReportSpecialisticoElaborazioneAction,
  selectReportToCloseDialogElaborazioniAction,
  selectSensorsSpecialisticaElaborazioneAction,
  selectTableDettaglioElaborazioneAction,
  setDataToGraficiElaborazioneAction,
  setDBElaborazioneAction,
  setPeriodoElaborazioneAction,
  setTypeGraficoElaborazioneAction,
  successAnagraphElaborazionieAction,
  successGetParametersElaborazioneAction,
  successSensorElaborazioniAction,
  visibilityElaborazioneAction
} from "../actions";
import {TypeSelectReport} from "./reportistica.reducer";
import {initStateElaborazione} from "../index";
import {IParameter} from "@models/dataService";
import IResponseReportistica from "@services/core/api/reportistica/models/getReportistica.model";
import {TimePeriod} from "@services/core/api/reportistica/models/getResponseAnagrafh.model";
import {IFormYears} from "@components/shared/dialogs/dialog-init-config/specilistico-form/specialistico-form.component";
import {IResponseItems, ItemTypeSpecialistico} from "@services/core/api/reportistica/models/getResponseItem.model";


export const ELABORAZIONE_FEATURE_KEY = 'elaborazione';

export interface IGraficiElaborazioni {
  tipo: string;
  active: boolean;
  data: Array<IResponseReportistica>;
  indexTime: number;
}

export interface IDateToService {
  begin: number;
  end: number;
  beginUtc: string;
  endUtc: string;
}

export interface ISpecialisticoState {
  idReport?: string;
  time?: TimePeriod;
  anni?: IFormYears;
  date?: IDateToService;
  keysSensor?: string[];
  netWork?: IResponseItems;
  station?: IResponseItems;
  parametri?: IResponseItems;
  sensor?: IResponseItems;
  result?: ItemSearchType;
}

export interface IElaborazioneState {
  db: UserStateLock;
  select_report?: TypeSelectReport;
  selezioneElaborazione?: IFormElaborazione;
  parametri: Array<IParameter>;
  tipiGrafici: Array<IGraficiElaborazioni>;
  parametriVisibility: Array<IParameter>;
  parametroVisibility?: IParameter;
  indexDettaglio?: string;
  specialistico: ISpecialisticoState,
  progressReport?: number;
}


export const elaborazioneReducer = createReducer(
  initStateElaborazione,
  on(setDBElaborazioneAction, (state, {db}) => ({...state, db})),
  on(selectReportToCloseDialogElaborazioniAction, (state, {report}) => ({...state, select_report: report})),
  on(addElaborazioneSelectionAction, (state, {form}) => ({
    ...state,
    selezioneElaborazione: form
  })),
  on(addGraficoElaborazioneAction, (state, {indexTime, value}) => {
    let updatedTipiGrafici = [...state.tipiGrafici.map(grafico => ({...grafico, active: false}))];

    let hasTipo = state.tipiGrafici.some(grafico => grafico.tipo === value);

    let newGraphType = {tipo: value, active: true, data: [], indexTime};
    return {
      ...state,
      tipiGrafici: hasTipo ? state.tipiGrafici : [...updatedTipiGrafici, newGraphType]
    }
  }),
  on(setDataToGraficiElaborazioneAction, (state, {timesstamps}) => {
    let updatedTipiGrafici = state.tipiGrafici.map(grafico => {
      if (grafico.active) {
        return {...grafico, data: timesstamps};
      } else {
        return grafico;
      }
    });
    return {
      ...state,
      tipiGrafici: updatedTipiGrafici
    }
  }),
  on(visibilityElaborazioneAction, (state, {parametri}) => ({
    ...state,
    parametriVisibility: parametri
  })),
  on(selectParametroElaborazioneAction, (state, {parametro}) => ({
    ...state,
    parametroVisibility: parametro
  })),
  on(setTypeGraficoElaborazioneAction, (state, {tipo}) => {
    return {
      ...state,
      tipiGrafici: state.tipiGrafici.map(grafici => {
        if (grafici.active) {
          return {
            ...grafici,
            tipo,
            data: []
          }
        }
        return grafici
      })
    }
  }),
  on(attivoGraficoElaborazioneAction, (state, {index}) => ({
    ...state,
    tipiGrafici: state.tipiGrafici.map((grafico, i) => ({...grafico, active: i === index}))
  })),
  on(setPeriodoElaborazioneAction, (state, {body}) => ({
    ...state,
    selezioneElaborazione: {
      ...body
    }
  })),
  on(addParametriElaborazioniAction, (state, {parametri}) => ({
    ...state,
    parametri
  })),
  on(deleteParametroElaborazioneAction, (state, {store, grafici, indexDettaglio}) => ({
    ...state,
    parametri: store,
    tipiGrafici: grafici,
    indexDettaglio
  })),
  on(deleteParametriToGrafico, (state, {grafici}) => ({
    ...state,
    tipiGrafici: grafici
  })),
  on(resetStateElaborazione, (state) => ({
    ...state,
    parametri: [],
    tipiGrafici: [],
    indexDettaglio: undefined
  })),
  on(removeGraficoElaborazioniAction, (state, {index}) => {
    return {
      ...state,
      tipiGrafici: state.tipiGrafici.filter((grafico, i) => i !== index)
    }
  }),
  on(activateGraficoElaborazioneAction, (state, {indexTime}) => ({
    ...state,
    tipiGrafici: state.tipiGrafici.map(item => ({...item, active: item.indexTime === indexTime}))
  })),
  on(selectTableDettaglioElaborazioneAction, (state, {index}) => ({
    ...state,
    indexDettaglio: index
  })),
  on(addNewParameterToListElaborazioneAction, (state, {parametri}) => ({
    ...state,
    parametri: [...state.parametri, ...parametri],
  })),
  on(addNewTimeToListGraficiElaborazioneAction, (state, {grafici}) => ({
    ...state,
    tipiGrafici: grafici
  })),
  on(resetStoreElaborazioneSpecialistico, (state) => ({
    ...state,
    specialistico: {
      idReport: undefined,
      station: undefined,
      date: undefined,
      netWork: undefined,
      parametri: undefined,
      keysSensor: undefined,
      anni: undefined,
      time: undefined,
    }
  })),
  on(saveReportIdSpecialisticoElaborazioneAction, (state, {id, time}) => ({
    ...state,
    specialistico: {
      ...state.specialistico,
      idReport: id,
      time
    }
  })),
  on(saveYearsToSpecialisticoElaborazioneAction, (state, {anni}) => ({
    ...state,
    specialistico: {
      ...state.specialistico,
      anni,
      date: undefined,
      keysSensor: undefined,
      parametri: undefined,
      station: undefined,
      netWork: undefined,
    }
  })),
  on(successAnagraphElaborazionieAction, (state, {response}) => {

    let stateSpecifico: ISpecialisticoState = {
      ...state.specialistico,
      netWork: undefined,
      station: undefined,
      parametri: undefined,
      sensor: undefined,
      keysSensor: undefined,
    };

    let test = ItemTypeSpecialistico[response.itemType]

    stateSpecifico[`${test}`] = response;

    return {
      ...state,
      specialistico: {
        ...stateSpecifico
      }
    }
  }),
  on(successGetParametersElaborazioneAction, (state, {response}) => ({
    ...state,

    specialistico: {
      ...state.specialistico,
      netWork: response
    }

  })),
  on(seccessStationElaborazioniAction, (state, {response}) => ({
    ...state,
    specialistico: {
      ...state.specialistico,
      station: response,
      keysSensor: undefined
    }
  })),
  on(successSensorElaborazioniAction, (state, {response}) => ({
    ...state,
    specialistico: {
      ...state.specialistico,
      sensor: response,
      keysSensor: undefined
    }
  })),
  on(deleteSpecialisticoAction, (state) => ({...state, specialistico: {}})),
  on(selectSensorsSpecialisticaElaborazioneAction, (state, {sensori, tipo = 'SENSOR'}) => ({
    ...state,
    specialistico: {
      ...state.specialistico,
      keysSensor: sensori,
      result: tipo
    }
  })),
  on(selectedDateElaborazioneAction, (state, {date}) => ({
    ...state,
    specialistico: {
      ...state.specialistico,
      date,
      anni: undefined,
      keysSensor: undefined,
      parametri: undefined,
      station: undefined,
      netWork: undefined,
    }
  })),
  on(selectReportSpecialisticoElaborazioneAction, (state, {}) => ({
      ...state,
      specialistico: {
        ...state.specialistico,
        anni: undefined,
        date: undefined,
        netWork: undefined,
        station: undefined,
        parametri: undefined,
        keysSensor: undefined
      }
    })
  ),
  on(addProgressReportisticaAction, (state, {report}) => ({...state, progressReport: report}))
)
