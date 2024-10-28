/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { createReducer , on } from '@ngrx/store';
import { initStateGrafico } from '../index';
import { IGrafico } from '@models/grafico';
import { ObservableData } from '@models/dataService';
import {IDataZoom, IGeneratePoint, PeriodType, ScaleEnum} from '@components/shared/grafico/compositive_grafic/models';
import {
  addDataZoomToInstance,
  addGetSensorDataAction, addGraficoNascosto,
  clickOnPoint,
  DataZoom,
  dataZoomAction,
  deleteGrafico,
  initGrafico,
  resetOnPointGraficoAction, saveSuccessGraficoAction,
  selectGrafico,
  setDateGetSensorDataAction,
  setPeriod,
  setScaleGraficoAction
} from '../actions';
import { formatDate } from '@angular/common';
import {state} from "@angular/animations";

export interface IGraficoState {
  grafici: Array<IGrafico>;
  parametro_selezionato?: ObservableData;
  periodo?: PeriodType;
  clickOnPoint?: Partial<IGeneratePoint>;
  dataZoom?: { start: number, end: number, batch?: Array<DataZoom> };
  getSensoreData?: IGrafico[];
  startDate?: string | number;
  endDate?: string | number;
  dataZoomInstance?: IDataZoom & {startValueFormatted?: string; endValueFormatted?: string};
  scalaGrafico?: ScaleEnum;
  listaGraficiNascosti: Array<string>
}


export const graficoReducer = createReducer(
  initStateGrafico ,
  on( initGrafico , ( state , { grafici , periodo } ) => ( {
    ...state ,
    grafici ,
    periodo
  } ) ) ,
  on( selectGrafico , ( state , { parametro_selezionato } ) => ( {
    ...state ,
    parametro_selezionato
  } ) ) ,
  on( clickOnPoint , ( state , { value } ) => ( {
    ...state ,
    clickOnPoint: value
  } ) ) ,
  on( resetOnPointGraficoAction , (state , {selezionato}) => ( {
    ...state ,
    clickOnPoint: !!selezionato ? undefined : state.clickOnPoint
  }) ) ,
  on( setPeriod , ( state , { value } ) => ( {
      ...state ,
      periodo: value
    }
  ) ) ,
  on( dataZoomAction , ( state , { start , end , batch } ) => ( {
    ...state ,
    dataZoom: { ...state.dataZoom , start , end , batch }
  } ) ) ,
  on(setDateGetSensorDataAction, (state, { startDate, endDate }) => ({
    ...state,
    startDate,
    endDate
  })),
  on(addGetSensorDataAction, (state, { data }) => ({
    ...state,
    getSensoreData: data
  })),
  on(addDataZoomToInstance, (state, { dataZoom }) => ({
    ...state,
    dataZoomInstance: {
      ...dataZoom,
      startValueFormatted: dataZoom?.startValue ? formatDate(dataZoom?.startValue, 'dd/MM/yyyy HH:mm', 'it') : '',
      endValueFormatted: dataZoom?.endValue ? formatDate(dataZoom?.endValue, 'dd/MM/yyyy HH:mm', 'it') : ''
    }
  })),
  on( saveSuccessGraficoAction, (state, { grafici }) => ({
    ...state,
    grafici
  })),
  on( setScaleGraficoAction , ( state , { scale: scalaGrafico } ) => ( {
    ...state ,
    scalaGrafico
  } ) ) ,
  on( deleteGrafico , ( state , { key } ) => {
    let grafici = state.grafici.filter( ( grafico ) => grafico.key !== key );
    return {
      ...state,
      grafici,
      dataZoom: grafici.length === 0 ? undefined : state.dataZoom,
      dataZoomInstance: grafici.length === 0 ? undefined : state.dataZoomInstance
    };
  }  ),
  on(addGraficoNascosto, (state, {key}) => {
    let set = new Set(state.listaGraficiNascosti);
    set.has(key) ? set.delete(key) : set.add(key);
    let list = Array.from(set);

    return {
      ...state,
      listaGraficiNascosti: list
    }
  })
)

