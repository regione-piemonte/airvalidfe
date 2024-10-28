export interface ITranslate {
  button:                 Button;
  contexMenu:             ContexMenu;
  table:                  ITableResponse;
  input:                  Input;
  mainMenu:               MainMenu;
  dialogInitConfig:       DialogInitConfig;
  dialogLinearCorrection: DialogCorrection;
  dialogManualCorrection: DialogCorrection;
  dialogDate:             DialogDate;
  dialogMinMax:           DialogAnno;
  dialogAnno:             DialogAnno;
  dialogExportCSV:        DialogAnno;
  dialogParameters:       DialogParameters;
  dialogDataNotValid:     DialogDataNotValid;
  page:                   Page;
}

export interface Button {
  conferma:     string;
  annulla:      string;
  prosegui:     string;
  chiudi:       string;
  settings:     string;
  exit:         string;
  group:        Group;
  refresh:      string;
  refreshPage:  string;
  save:         string;
  openMenu:     string;
  closeMenu:    string;
  valid:        string;
  certifica:    string;
  addParams:    string;
  export:       string;
  saveSettings: string;
  ariaLabel:    ButtonAriaLabel;
  tooltip:      ButtonTooltip;
}

export interface ButtonAriaLabel {
  conferma:      string;
  annulla:       string;
  prosegui:      string;
  chiudi:        string;
  exit:          string;
  delete:        string;
  addParams:     string;
  exportParamas: string;
  showStation:   string;
  hideStation:   string;
  userLock:      string;
  writing:       string;
  readOnly:      string;
  goToPage:      MainMenu;
}

export interface MainMenu {
  reportistica:  string;
  validazione:   string;
  elaborazione:  string;
  impostazioni?: string;
}

export interface Group {
  scelta_servizio:          SelectChoiceRender[];
  scelta_scala:             SelectChoiceRender[];
  scelta_periodo:           SceltaPeriodo[];
  scelta_periodo_parametri: SceltaPeriodoParametri;
  tooltip:                  GroupTooltip;
  scelta_elaborazione:      SceltaPeriodoParametri;
  scelta_render:            SelectChoiceRender[];
  scelta_render_specialistico: SelectChoiceRender[];
  scelta_render_standard: SelectChoiceRender[];
}

export interface SceltaPeriodo {
  name:    string;
  value:   string;
  tooltip: string;
  icon?:   boolean;
}

export interface SceltaPeriodoParametri {
  label:       string;
  toggle_group: SelectChoiceRender[];
}

interface SelectChoiceGroup extends SelectChoiceRender {

}

export interface SelectChoiceRender {
  name:  string;
  value: ChangeRenderParamsType;
  active: boolean;
  text: string;
  toggle_group?: SelectChoiceGroup[];
}
export type ChangeRenderParamsType = 'notvalid' | 'notvalidate' | 'notcertified' | 'missing' | 'none' | 'statistica';
export interface GroupTooltip {
  noSelection: string;
  prevDay:     string;
  nextDay:     string;
  customRange: string;
  oneDay:      string;
  threeDay:    string;
  oneWeek:     string;
  oneMonth:    string;
  resetRange:  string;
}

export interface ButtonTooltip {
  showData:              string;
  notShowData:           string;
  validData:             string;
  notValidData:          string;
  toggleDecimal:         string;
  toggleDecimalOriginal: string;
}

export interface ContexMenu {
  parameters: Parameters;
}

export interface Parameters {
  deleteListPar:      string;
  showOriginalData:   string;
  hideOriginalData:   string;
  compareTime:        string;
  showGraphic1:       string;
  showGraphic2:       string;
  showNotValidData:   string;
  hideNotValidData:   string;
  changeColor:        string;
  parametersCompare:  string;
  requestCalibration: string;
}

export interface DialogAnno {
  title:    string;
  subtitle: string;
}

export interface DialogDataNotValid {
  title: string;
  body:  string;
}

export interface DialogDate {
  title:      string;
  subtitle:   string;
  textInfo:   string;
  inputStart: string;
  inputEnd:   string;
}

export interface DialogInitConfig {
  step1: Step1;
  step2: Step2;
  step3: Step3;
}

export interface Step1 {
  title:     string;
  paragraph: string;
  from:      string;
  to:        string;
}

export interface Step2 {
  title:     string;
  paragraph: string;
}

export interface Step3 {
  title:     string;
  paragraph: string;
  preset:    Preset;
  noPreset:  Preset;
}

export interface Preset {
}

export interface DialogCorrection {
  title:    string;
  subtitle: string;
  inputMin: string;
  inputMax: string;
}

export interface DialogParameters {
  title:     string;
  subtitle1: string;
  subtitle2: string;
}

export interface Input {
  required:                string;
  lang:                    Lang;
  theme:                   Theme;
  font:                    Font;
  layout:                  Font;
  togglePreset:            string;
  labelTogglePreset:       string;
  toggleDecimal:           string;
  toggleOriginal:          string;
  labelSelectChoiceRender: string;
  select_choice_render:      SelectChoiceRender[];
}

export interface Font {
  label:  string;
  option: SelectChoiceRender[];
}

export interface Lang {
  label:         string;
  disabledLabel: string;
  option:        SelectChoiceRender[];
}

export interface Theme {
  label: string;
  light: string;
  dark:  string;
}

export interface Page {
  validazione:  Validazione;
  impostazioni: Impostazioni;
}

export interface Impostazioni {
  title:     string;
  paragraph: string;
  titleSEC:  TitleSEC;
}

export interface TitleSEC {
  lang:   string;
  theme:  string;
  layout: string;
  font:   string;
  preset: string;
}

export interface Validazione {
  splitGrafico:   SplitGrafico;
  splitParametro: SplitParametro;
  splitDettaglio: SplitDettaglio;
  modali:         Modali;
}

export interface Modali {
  correzioneLineare: DialogAnno;
}

export interface SplitDettaglio {
  title:       string;
  parametro:   string;
  stazione:    string;
  menuContxDx: MenuContxDx;
}

export interface MenuContxDx {
  correzioneLineare: string;
  valida:            string;
  invalida:          string;
  certifica:         string;
 // decertifica:       string;
}

export interface SplitGrafico {
  title1:    string;
  subtitle1: string;
  title2:    string;
  subtitle2: string;
  from:      string;
  to:        string;
  ariaLabel: SplitGraficoAriaLabel;
}

export interface SplitGraficoAriaLabel {
  grafici:       string;
  scala:         string;
  periodo:       string;
  inizioPeriodo: string;
  finePeriodo:   string;
}

export interface SplitParametro {
  title: string;
}

export interface ITableResponse {
  body:       Body;
  pagination: Pagination;
}

export interface Body {
  header:    Header;
  dettaglio: string[];
  preset:    string[];
}

export interface Header {
  parameter: string;
  station:   string;
  action:    string;
}

export interface Pagination {
  perPage:      string;
  of:           string;
  nextPage:     string;
  previousPage: string;
  firstPage:    string;
  lastPage:     string;
}
