export interface ResponseToReport {
  reportName:    null;
  executionTime: null;
  header:        Header[];
  tables:        Table[];
  footer:        null;
}

export interface Header {
  value:       string;
  titleLevel:  TitleLevel;
  highlighted: boolean;
}

export enum TitleLevel {
  L1 = "L1",
  L2 = "L2",
  L3 = "L3",
  N1 = "N1",
}

export interface Table {
  titleName:  string | null;
  numColumns: number;
  header:     Header[];
  data:       Datum[];
  footer:     Header[];
}

export interface Datum {
  row: Row[];
}

export interface Row {
  value:       string;
  titleLevel:  TitleLevel | null;
  highlighted: boolean;
  monospace:   boolean;
  rangeType:   null;
  rangeValue:  null;
  tooltip:     null;
}
