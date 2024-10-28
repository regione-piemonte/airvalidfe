import {TypeValueToSpecialistico} from "@state/effects/*";

export interface IMY_FORMATS {
  parse: { dateInput: string };
  display: { dateA11yLabel: string; monthYearA11yLabel: string; monthYearLabel: string; dateInput: string };
}

export let MY_FORMATS: IMY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};


export type TypePeriod = "personalizzato" | "mese" | "anno" | "giorno";

export type CurrentViewType = 'multi-year' | 'year' | 'month';

export interface IListTerritorial {
  name:      string;
  key:       string;
  active:    boolean;
  extraInfo: ExtraInfo;
  flags:     Flags;
  beginDate: number;
  endDate:   null;
}

export enum ExtraInfo {
  Empty = "",
  Write = "write",
  WriteAdvanced = "write advanced",
}

export enum Flags {
  Private = "private",
  Public = "public",
  PublicManaged = "public_managed",
}


export interface MenuItem {
  text: string;
  value: string;
  active: boolean;
  toggle_group?: MenuItem[];
  sub_group?: string;
}

export interface ToggleGroup {
  text: TypeValueToSpecialistico | string;
  value: string;
  active?: boolean;
  group?: string;
  sub_group?: string;
  toggle_group?: ToggleGroup[];
  isSelected?: boolean;
}


export interface IFormData {
  lavoro: string;
  startDate: string;
  endDate: string;
}

export type ITypeForm = 'lavoro' | 'startDate' | 'endDate' | 'tipoElaborazione' | 'tipoGrafico';
