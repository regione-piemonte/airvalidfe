/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {createReducer, on} from "@ngrx/store";
import {initStateLockValidazione} from "../index";
import {caricaLimitDaStoreValidazioneAction, changeLockValidazioneAction, deleteStateLockValidazioneAction, setLockStateValidazioneAction, setStateLockValidazioneAction} from "@actions/*";

export const validazioneReducer = createReducer(
  initStateLockValidazione,
  on(setStateLockValidazioneAction, (state, {response}) => ({
    ...state,
    stateLock: response,
  })),
  on(changeLockValidazioneAction, (state, {parametro}) => ({...state, changes: [...parametro.filter(item => !item.myLock && !item.locked)] })),
  on(setLockStateValidazioneAction, (state, {parametro}) => {
    return {
      ...state,
      stateLock: state.stateLock.map(lock => {
        return parametro.measurementId === lock.measurementId ? { ...lock, ...parametro } : lock;
      })
    };
  }),
  on(caricaLimitDaStoreValidazioneAction, (state, {limiti}) => ({
    ...state,
    limiti
  })),
  on(deleteStateLockValidazioneAction, (state) => ({
    ...initStateLockValidazione
  }))
)
