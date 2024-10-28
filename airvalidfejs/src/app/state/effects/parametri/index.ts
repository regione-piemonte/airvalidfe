/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {ActionsParametersEffects} from "./actionsParameters.effects";
import {RicercaEffects} from "./ricerca.effects";
import {DeleteEffects} from "./delete.effects";
import {NavigationEffects} from "../navigation/navigation.effects";

// export * from "./delete.effects";
// export * from "./ricerca.effects";
// export * from "./actionsParameters.effects";

/**
* @description Export di tutti gli effetti per i parametri
*/
export const allEffectsParameters = [
  DeleteEffects,
  RicercaEffects,
  ActionsParametersEffects,
  NavigationEffects
];
