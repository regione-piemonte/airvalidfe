/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import * as moment from 'moment';

export interface ITooltip {
  axisPointer: { label: { formatter: ( value: any ) => moment.Moment; backgroundColor: string; color: string } };
  trigger: string;
  type: string;
}

export interface IGrid {
  top: string;
  left: string;
  bottom: string;
  right: string;
  containLabel: boolean;
}

export interface IXAxis {
  axisLabel?: { formatter: ( value: number, index: number ) => string };
  type: string;
  boundaryGap: boolean;
}

export interface IYAxis {
  type: string;
  axisLabel: { formatter: string };
  min?: number;
  max?: number;
}

export interface IToolbox {
  feature: { dataZoom: { yAxisIndex: string } };
  show: boolean;
}

export interface IDataZoom {
  fontSize: number;
  filterMode: string;
  realtime: boolean;
  moveOnMouseMove: boolean;
  zoomOnMouseWheel: boolean;
  start: number;
  startValue: number;
  moveOnMouseWheel: boolean;
  end: number;
  endValue: number;
  type: string;
  labelFormatter: ( value: number, valueString: string ) => string;
}

export interface IVisualMap {
  pieces: any[];
  show: boolean;
  dimension: number;
}

export interface IOptionGrafic {
  legend?: {
    show: boolean;
    selected: Record<string , boolean>;
  };
  tooltip: ITooltip;
  grid: IGrid;
  useUTC: boolean;
  xAxis: IXAxis;
  yAxis: IYAxis;
  toolbox: IToolbox;
  graphic: { progressive: boolean; type: string };
  dataZoom?: Partial<IDataZoom>[];
  visualMap: IVisualMap;
  series: Array<Partial<ICreateItemData<any>>>;
}

export type ScaleType = 'assoluta' | 'relativa';

export interface IEchatsEvent {
  type: string
  from: string
  dataZoomId: string
  animation: any
  start: number
  end: number
  batch: any[]
}

export interface IGeneratePoint {
  value: any[];
  symbolSize: number;
  point_dataset: any;
  itemStyle?: {
    color?: string;
    show?: boolean;
    borderWidth?: number;
    borderColor?: string;
  },
  symbol?: string;
  show: boolean;
}

export interface ILineStyle {
  color: string;
  width: number;
  type: string;
  showSymbol?: boolean
}

export type TypeSymbol = 'circle' | 'rect' | 'roundRect' | 'triangle' | 'diamond' | 'pin' | 'arrow' | 'none';

export interface IMarkPoint {
  symbol?: TypeSymbol;
  symbolSize?: number;
  name: string;
  xAxis?: number;
  yAxis?: number;
  x?: number;
  y?: number;
  value?: number | string;
  itemStyle?: {
    color?: string;
    borderWidth?: number;
  };
}

interface ItemStyle {
  color?: string;
  opacity?: number;
}

export interface ICreateItemData<T> {
  id?: number;
  xAxisIndex?: number;
  yAxisIndex?: number;
  symbol?: string;
  smooth?: boolean;
  name: string;
  type: string;
  sampling?: string;
  animation: boolean;
  lineStyle: Partial<ILineStyle>;
  itemStyle?: {
    color?: string;
  };
  data: Array<Partial<IGeneratePoint>> | [ number , number ][];
  dataAfterRelativa?: Array<Partial<IGeneratePoint>> | [ number , number ][];
  markArea: Partial<{
    itemStyle: ItemStyle,
    emphasis:Partial<{
      disabled: boolean,
      itemStyle: ItemStyle
    }>,
    data: Array<{xAxis?: number}>[]
  }>;
  showSymbol?: boolean,
  symbolSize?: number,
  markPoint?: {
    data: Array<IMarkPoint>;
  };
  markLine?: {
    symbol: [TypeSymbol, TypeSymbol],
    label: { show: boolean },
    data: Array<{xAxis: number}>
  },
}

export interface IGetLegend {
  show: boolean;
  selected: Record<string , boolean>;
}

export type PeriodType = '1' | '3' | '7' | '30' | 'full' | 'personalized' | 'succ' | 'prec';
