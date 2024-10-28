/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Dataset} from "@models/grafico";
import {IParameter} from "@models/dataService";

export type ActionParametersType = 'confronta' | 'delete' | 'showOriginData' | 'showNotValidData' | 'taratura' | 'color-picker' | 'parametri-correlati' | 'notShowNotValidData';
export type TypeIconsToParameters = 'lock' | 'menu_book' | 'mode_edit';
export type TypeLabelButton = 'button.aria_label.read_only' | 'button.aria_label.user_lock' | 'button.aria_label.writing' | string;
export type TypeLabelRecord = 'virtual' | 'write' | 'advanced' | 'lock' | 'btn_read_only' | 'btn_user_lock' | 'btn_writing';
export type TypeSelectorInput = {parameter: Partial<IParameter> | undefined, dataset: Dataset[] | undefined, index: number | undefined}
