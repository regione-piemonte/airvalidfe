/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
//**** Validazione da spostare **//
import {IGetStatusLock, IResponseLockWithName} from "@models/interface/BE/response/getLock";
import {createAction} from "@ngrx/store";
import {IResponseLimiti} from "../index";

/**
 * Action to initialize the state lock for the validation module.
 * This action is triggered to set the state with a response containing
 * an array of IResponseLockWithName objects.
 *
 * @param {IResponseLockWithName[]} response - An array of objects representing the response with lock details.
 * @returns {Object} An action object with the provided response.
 */
export const setStateLockValidazioneAction = createAction('[Validazione] Init State Lock', (response:IResponseLockWithName[]) => ({response}));
/**
 * Action to change the lock status of the 'Validazione' parameters.
 *
 * @constant {Function} changeLockValidazioneAction - A Redux action creator.
 * @param {string} type - The action type identifier.
 * @param {Function} payloadCreator - A function that defines the payload for this action.
 * @returns {Object} Action object with type and payload.
 * @param {IResponseLockWithName[]} parametro - An array of parameters representing the lock status to be changed.
 */
export const changeLockValidazioneAction = createAction('[Validazione] Change lock parametro', (parametro:IResponseLockWithName[]) => ({parametro}));
/**
 * Action creator to change the lock state of a single parameter in the validazione module.
 *
 * This action represents the intention to change the locking state of a specific parameter
 * identified by the `IGetStatusLock` interface. It is used to update the state related to
 * the locking mechanism within the application's validation process.
 *
 * @param {IGetStatusLock} parametro - The parameter that specifies the lock state to be changed.
 * @returns An action with the type '[Validazione] Change lock singolo parametro' and the payload containing the parameter.
 */
export const setLockStateValidazioneAction = createAction('[Validazione] Change lock singolo parametro', (parametro: IGetStatusLock) => ({parametro}));
/**
 * Action that deletes the state in the application's validazione module.
 *
 * This action is typically dispatched when there is a need to reset or clear
 * the current state related to the validation context.
 *
 */
export const deleteStateLockValidazioneAction = createAction('[Validazione] Delete state');

export const caricaLimitDaStoreValidazioneAction = createAction('[Validazione] Carica limiti', (limiti: Array<IResponseLimiti>) => ({limiti}));
