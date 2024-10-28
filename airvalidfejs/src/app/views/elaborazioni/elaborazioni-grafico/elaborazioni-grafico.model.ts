export interface IValueSelect {
  name: string;
  value: number;
}

export interface IDataToSerie {
  name:string;
  value: number | (number | null | undefined)[] | null | undefined
}

export interface IDataToTransform {
  idSerie: any;
  name: any;
  showSymbol: undefined | boolean;
  symbol: string;
  symbolSize: number;
  type: string;
  lineStyle: { width: number };
  timebase: any;
  data?: Array<IDataToSerie>
}
