/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {createSelector} from '@ngrx/store';
import {AppState, IDialog} from '../index';
import {
    AreeTerritoriali,
} from "@components/shared/dialogs/services/models/parameters.dialog.interaface";
import {IData, IStatus, Parametri, SelectedStatus, Stazioni} from "@models/validazione";
import {ISelectPeriodoState} from "@reducers/*";
import {dialogReportisticaLavoroSelector} from "./reportistica.selectors";


export const dialogFeature = (state: AppState) => state.dialog;

/**
* @description Selector che restituisce il valore del dialog Config
*/
export const dialogConfigSelector = createSelector<AppState, IDialog,ISelectPeriodoState>(
    dialogFeature,
    (state) => state.dialogConfig!
)



export const parametriDialogSelector = createSelector(
    dialogFeature,
    (state) => state.dialogParameter?.data ?? {
        all: [] as Parametri[],
        selected: {
            status: [] as IStatus[],
            parametri: [] as Parametri[],
            areeTerritoriali: [] as AreeTerritoriali[],
            stazioni: [] as Stazioni[],
        } as SelectedStatus,
    } as IData
)

export const parametriDialogSelected = createSelector(
    dialogFeature,
    (state) => state.dialogParameter?.dataAdd?.selected?.parametri
)

export const stazioniDialogSelector = createSelector(
    dialogFeature,
    (state) => state.dialogParameter?.dataAdd?.selected?.stazioni
)
/**
 * @description Restituisce il valore booleano se ci sono dati nel valore ALL del dialog parameter
 */
export const isDataDialogSelector = createSelector(
    parametriDialogSelector,
    (state) => state.all.length > 0
)

export const dialogLavoroSelector = createSelector(
    dialogFeature,
    (state) => state.dialogConfig?.lavoro!
)

export const dialogLavoroPeriodoSelector = createSelector(
  dialogFeature,
  (state) => state.dialogConfig?.periodo?.lavoro
)

export const nextDialogSelector = createSelector(
    dialogFeature,
    dialogReportisticaLavoroSelector,
    (state, lavoro) => ({next: state.dialogConfig?.next, pagina: lavoro})
)

/**
 * @description Selector che restituisce la lista dei parametri all
 */
export const dialogParameterAllSelector = createSelector(
    parametriDialogSelector,
    (state) => state.all
)

export const dialogParameterSelector = createSelector(
    parametriDialogSelector,
    (state) => state.selected.parametri
)

export interface IStatePeriodo {
    startDate: number;
    endDate: number;
    dataInizio?: string;
    dataFine?: string;
}

/**
 * @description Selector che mi restituisce il periodo selezionato per la ricerca
 */
export const dialogConfigPeriodoSelector = createSelector<AppState, IDialog, IStatePeriodo>(
    dialogFeature,
    (state) => {
        return {
            ...state.dialogConfig?.periodo,
            startDate: new Date(state.dialogConfig?.periodo?.dataInizio ?? '').getTime(),
            endDate: new Date(state.dialogConfig?.periodo?.dataFine ?? '').getTime()
        }
    }
)

export const changePeriodoSelector = createSelector(
    dialogFeature,
    (state) => state.dialogConfig?.changePeriod
)
