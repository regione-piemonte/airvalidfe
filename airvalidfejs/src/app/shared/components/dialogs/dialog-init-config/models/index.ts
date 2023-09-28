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


export type TypePeriod = "giornaliera" | "mensile" | "annuale";

export type CurrentViewType = 'multi-year' | 'year' | 'month';
