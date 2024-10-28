import {ElaborazioniReportType} from "@services/core/api/reportistica/models/getReportistica.model";

export interface ITabelleParams {
  sintesi: boolean;
  giorno_medio: boolean;
  statistiche_giornaliere: boolean;
  statistiche_mensili: boolean;
  matrice_oraria: boolean;
  stat_giorni_settimana: boolean;
  percentili: boolean;
}

export interface IFormToStandard {
  controlTime: ElaborazioniReportType;
  flag: boolean;
  colori_evidenziazione: boolean;
  nomi_reti: boolean;
  anagrafiche_righe: boolean;
  tabelle: ITabelleParams;
}
