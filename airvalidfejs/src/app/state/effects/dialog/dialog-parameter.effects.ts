/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import { Actions , createEffect , ofType } from '@ngrx/effects';
import {map, switchMap, take, withLatestFrom} from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '../../index';
import {dialogConfigSelector, parametriDialogSelector} from '@selectors/*';
import {addParameterAction, saveDialogParameterAction, setDBDialogAction, setDBElaborazioneAction, setDBReportisticaAction} from "@actions/*";

@Injectable()
export class DialogParameterEffects {

  constructor(
    private readonly actions$: Actions ,
    private readonly storeService: Store<AppState> ,
  ) { }

  /**
   * @description Metodo statico per la concatenazione di Array
   *
   */
  private static concatArray<T>( array1: T[] , array2: T[] ): T[] {
    return array1.concat( array2 );
  }

  /**
   * @description Metodo che prende ogni singolo elemento dell'Array per poterlo usare con un new Set
   */
  private static createSetArray<T>( array: T[] ): T[] {
    return Array.from( new Set( array.map( item => JSON.stringify( item ) ) ) ).map( itemS => JSON.parse( itemS ) );
  }

  addParameterEffects$ = createEffect( () =>
    this.actions$.pipe(
      ofType( addParameterAction ) ,
      switchMap( ( { parameters } ) => this.storeService.select( parametriDialogSelector )
        .pipe(
          take( 1 ) ,
          map( ( parametri ) => ( { parametri , parameters } )
          ) ) ) ,
      map( ( { parameters , parametri } ) => {
        let { parametri: par , status: stas , areeTerritoriali: are , stazioni: sta } = parametri.selected;
        let { parametri: parS , stazioni: staS , areeTerritoriali: areS , status: stasS = [] } = parameters.selected;
        let newlistAll = DialogParameterEffects.concatArray( parametri.all , parameters.all );
        let concatPar = DialogParameterEffects.concatArray( par , parS );
        let concatSta = DialogParameterEffects.concatArray( sta! , staS! );
        let concatAre = DialogParameterEffects.concatArray( are , areS );
        let concatStas = DialogParameterEffects.concatArray( stas! , stasS );

        newlistAll = DialogParameterEffects.createSetArray(newlistAll);
        concatPar  = DialogParameterEffects.createSetArray(concatPar);
        concatSta  = DialogParameterEffects.createSetArray(concatSta);
        concatAre  = DialogParameterEffects.createSetArray(concatAre);
        concatStas = DialogParameterEffects.createSetArray(concatStas);

        return saveDialogParameterAction( {
          data: {
            all: newlistAll ,
            selected: {
              parametri: concatPar ,
              stazioni: concatSta ,
              areeTerritoriali: concatAre ,
              status: concatStas
            }
          }
        } )
      } )
    )
  );

  /**
  * @description Rimango in ascolto del cambio del db per poter cambiare il valore del db
  */
  changeDB$ = createEffect( () =>
    this.actions$.pipe(
      ofType( setDBDialogAction ) ,
      withLatestFrom( this.storeService.select( dialogConfigSelector ) ) ,
      map( ( [value, select] ) => {
        if ( select && select.lavoro === 'reportistica' ) {
          return setDBReportisticaAction( value.db )
        }else {
          return setDBElaborazioneAction( value.db )
        }
      } )
    )
  );


}
