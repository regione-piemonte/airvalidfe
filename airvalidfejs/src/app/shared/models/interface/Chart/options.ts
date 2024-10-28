/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
export interface IAxisPointer {
  label: {
    formatter: ( value: any ) => string;
    backgroundColor: string; color: string
  };
}

interface ITooltip {
  axisPointer: IAxisPointer;
  trigger: string;
  type: string;
}

interface IGrid {
  top: string;
  left: string;
  bottom: string;
  right: string;
  containLabel: boolean;
}

interface IXAxis {
  axisLabel: { formatter: ( value: number ) => string };
  data: any;
  minInterval: number;
  type: string;
  boundaryGap: boolean;
}
// icon: { back: string } per il bottone di reset dello zoom
interface IToolbox {
  feature: { dataZoom: { yAxisIndex: string, icon: { back: string } } };
  show: boolean;
}

interface IGraphic {
  progressive: boolean;
  type: string;
}

export interface IOptionsChart {
  tooltip: ITooltip;
  grid: IGrid;
  useUTC: boolean;
  xAxis: IXAxis;
  yAxis: any;
  legend: any;
  toolbox: IToolbox;
  graphic: IGraphic;
  dataZoom: any;
  series: any;
}
