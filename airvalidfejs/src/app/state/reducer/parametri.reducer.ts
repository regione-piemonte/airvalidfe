/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {createReducer, on} from '@ngrx/store';
import {initStateParametri, initValueStateParametri} from '../index';
import {IParameter, ObservableData} from '@models/dataService';
import {
  changeShowNotValidDataParametroAction, changeShowOriginalDataParametroAction, changeValoreParametroAction, changeValoriParametroSelezionatoParametroAction,
  createListToIDataParametroAction, deleteAllParametroAction,
  deleteParametroAction, deleteParametroSelezionatoAction,
  deleteParametroToListsAction, deselezioneParametroAction, eventiToParametroAction,
  getLockParametroAction,
  initParametroAction, pollingDataParametroAction, registrazioneParametroAction, reloadPeriodoParametroAction, resetStateParametroAction,
  selectParametroAction,
  selectParametroTypeAction, setParametriAfterPollingParametroAction
} from '../actions';
import {IGetStatusLock} from '@models/interface/BE/response/getLock';
import {Moment} from "moment";
import {Parametri} from "@models/validazione";
import {format} from "date-fns";
import IGetEventsResponse from "@models/eventi/getEvents";

export interface IParametriState {
  parametri?: Array<IParameter>;
  dataPolling?: string;
  parametro_selezionato?: ObservableData;
  parametro_eliminato?: IParameter;
  locksParametri?: Array<{ key: string; item: Partial<IGetStatusLock>; dbId?: string }>;
  getLockParametro?: Partial<IParameter & IGetStatusLock>[];
  parametriWriteOrAdvanced?: Array<Parametri>;
  parametriNotWriteOrAdvanced?: Array<Parametri>;
  azioneSelezionata?: string;
  showNotValidData: boolean;
  showOriginalData: boolean;
  parametro_ricaricato?: string;
  listaParametri?: ReadonlyArray<IParameter>;
  reloadPeriodo?: boolean;
  eventiToParametro: Array<IGetEventsResponse>
  datiDaRichiamare?: {
    periodo?: {
      lavoro: string;
      endDate: Moment;
      startDate: Moment;
    },
    parametri: ReadonlyArray<IParameter>
  };
  pollingParametri?: boolean;
  reset: boolean;
}


export const parametriReducer = createReducer(
  initStateParametri ,
  on( initParametroAction , (state , { parametri , reload} ) => ( {
    ...state ,
    parametri,
    pollingParametri: false,
  } ) ) ,
  on( setParametriAfterPollingParametroAction , (state , { parametri } ) => ( {
    ...state,
    parametri,
    dataPolling: format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
    pollingParametri: true
  }) ) ,
  on( changeValoriParametroSelezionatoParametroAction, (state , { parametro } ) => ( {
    ...state ,
    parametro_selezionato: {
      ...state.parametro_selezionato!,
      parameter: {...parametro}
    }
  })) ,
  on( getLockParametroAction , (state , { item } ) => ( {
    ...state ,
    getLockParametro: state.getLockParametro ? [ ...state.getLockParametro , item ]: [ item ]
  } ) ) ,
  on( selectParametroAction , (state , { parametro_selezionato } ) => ( {
    ...state ,
    parametro_selezionato,
    parametro_eliminato: undefined
  } ) ) ,
  on(createListToIDataParametroAction, (state, {data}) => ({
    ...state,
    parametriWriteOrAdvanced: data.writeOrAdvanced,
    parametriNotWriteOrAdvanced: data.notWriteOrAdvanced
  })),
  on(deleteParametroToListsAction, (state, {key}) => ({
    ...state,
    listaParametri: state.listaParametri?.filter(({parametro}) => parametro.key !== key),
    parametriWriteOrAdvanced: state.parametriWriteOrAdvanced?.filter(({key: keyWrite}) => keyWrite !== key),
    parametriNotWriteOrAdvanced: state.parametriNotWriteOrAdvanced?.filter(({key: keyNotWrite}) => keyNotWrite !== key)
  })),
  on( selectParametroTypeAction , ( state , { action } ) => ( {
    ...state ,
    azioneSelezionata: action
  } ) ) ,
  on(changeShowNotValidDataParametroAction, (state, {showNotValidData}) => ({
    ...state,
    showNotValidData,
    parametro_selezionato: {
      ...state.parametro_selezionato!,
      parameter: {
        ...state.parametro_selezionato?.parameter!,
        visibleNotValid: showNotValidData
      }
    },
    parametri: [...state.parametri!.map(parametro => parametro.parametro.key === state.parametro_selezionato?.parameter.parametro.key ? {...parametro, visibleNotValid: showNotValidData} : parametro)],
    listaParametri: [...state.listaParametri!.map(item => item.parametro.key === state.parametro_selezionato?.parameter?.parametro?.key ? {...item, visibleNotValid: showNotValidData } : item )]
  })),
  on( changeShowOriginalDataParametroAction , (state , { showOriginalData } ) => ( {
    ...state ,
    showOriginalData,
    parametro_selezionato: {
      ...state.parametro_selezionato!,
      parameter: {
        ...state.parametro_selezionato?.parameter!,
        visibleOriginalData: showOriginalData,
        visibleOrigin: showOriginalData
      }
    },
    parametri: [...state.parametri!.map(parametro => parametro.parametro.key === state.parametro_selezionato?.parameter.parametro.key ? {...parametro, visibleOrigin: showOriginalData} : parametro)],
    listaParametri: [...state.listaParametri!.map(item => item.parametro.key === state.parametro_selezionato?.parameter?.parametro?.key ? {...item, visibleOrigin: showOriginalData } : item )]
  }) ) ,
  on ( changeValoreParametroAction , (state , { parametro_key } ) => ( {
    ...state ,
    parametro_ricaricato: parametro_key,
    pollingParametri: false,
    dataPolling: undefined,
  }) ) ,
  on( registrazioneParametroAction , (state , { parametri: listaParametri,reload, nuovoPeriodo} ) => ( {
    ...state ,
    parametri: listaParametri,
    parametro_eliminato: undefined,
    pollingParametri: false,
    dataPolling: undefined,
    listaParametri,
    reloadPeriodo: reload,
    datiDaRichiamare: {
      periodo: !!nuovoPeriodo ? {...nuovoPeriodo} : undefined,
      parametri: listaParametri
    }

  }) ) ,
  on( reloadPeriodoParametroAction , (state , { reload,parametri, data } ) => ( {
    ...state ,
    parametri,
    reloadPeriodo: reload,
    datiDaRichiamare: {
      periodo: !!data ? {...data} : undefined,
      parametri
    }
  }) ) ,
  on( pollingDataParametroAction , (state , { value } ) => ( {
    ...state ,
    pollingParametri: value,
    reloadPeriodo: false,
  })),
  on( deleteParametroAction , (state , { item } ) => ( {
    ...state ,
    parametro_selezionato: state.parametro_selezionato && state.parametro_selezionato.parameter.parametro.key === item.parametro.key ? undefined: state.parametro_selezionato ,
    parametro_eliminato: item,
    parametri: state.parametri?.filter( ( { measurementId, parametro } ) => parametro.key !== item.parametro.key ) ,
  } ) ) ,
  on(eventiToParametroAction, (state, eventi) => {
    // console.log(state, 'state');
    // console.log(eventi, 'eventi')
    return {...state, eventiToParametro: eventi.eventi}
  }),
  on(deleteAllParametroAction, (state) => ({
    ...initValueStateParametri
  })),
  on(resetStateParametroAction, (state, {reset}) => ({
    ...state,
    reset
  })),
  on(deleteParametroSelezionatoAction, (state, {parametro}) => ({
    ...state,
    parametro_selezionato: state.parametro_selezionato?.parameter.key === parametro.key ? undefined : state.parametro_selezionato,
  })),
  on(deselezioneParametroAction, (state) => ({
    ...state,
    parametro_selezionato: undefined,
  }))
)

