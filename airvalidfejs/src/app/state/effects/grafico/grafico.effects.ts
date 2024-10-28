/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';
import { Actions , createEffect , ofType } from '@ngrx/effects';
import {
  addGetSensorDataAction,
  addOnPoint,
  clickOnPoint,
  getSensorDataAction,
  resetPointActionDettaglio,
  selectPointDettaglio,
  setDateGetSensorDataAction,
  setPeriod
} from '@actions/*';
import { map , switchMap } from 'rxjs';
import { IGeneratePoint } from '@components/shared/grafico/compositive_grafic/models';
import { AppState } from '../../index';
import { Store } from '@ngrx/store';
import { listGraficiSelector } from '@selectors/*';
import { DatasService } from '@services/core/api';
import { IParameter } from '@models/dataService';

@Injectable()
export class GraficoEffects {

  constructor(
    private readonly actions$: Actions ,
    private readonly storeService: Store<AppState> ,
    private readonly datasService: DatasService ,
  ) { }

  clickOnPoint$ = createEffect( () =>
    this.actions$.pipe(
      ofType( clickOnPoint ) ,
      map( ( { value, indexPoint, indexSerie } ) => addOnPoint( {...value, index: indexPoint} ) )
    )
  );

  selectPointDettaglio$ = createEffect( () =>
    this.actions$.pipe(
      ofType( selectPointDettaglio ) ,
      map( ( { value } ) => {
        let body: Partial<IGeneratePoint> = {
          value: [ value.timestamp , value.valore_validato ] ,
          point_dataset: { ...value } ,
        }
        return clickOnPoint( body )
      } )
    )
  );

  setDateGetSensorData$ = createEffect( () =>
    this.actions$.pipe(
      ofType( setDateGetSensorDataAction ) ,
      map( ( { startDate , endDate } ) => getSensorDataAction( { startDate , endDate } ) )
    )
  );

  getSensorDataEffects$ = createEffect( () =>
    this.actions$.pipe(
      ofType( getSensorDataAction ) ,
      switchMap( ( { startDate , endDate } ) => this.storeService.select( listGraficiSelector )
        .pipe(
          map( grafici => ( { grafici: grafici.filter( grafico => !grafico.name.includes( 'origin' ) ) , startDate , endDate } ) )
        ) ) ,
      map( ( { startDate , endDate , grafici } ) => {
        let para: IParameter[] = [ ...grafici.map<IParameter>( item => ( {
          ...item ,
        } ) ) ];
        let sensor$ = grafici.map( gra => gra.parametro ).map( ( { key , measurementPeriod } ) => this.datasService.getSensorData( key , measurementPeriod , {
          start: startDate ,
          end: endDate ,
        } ) );
        return {
          sensor$ ,
          startDate ,
          endDate ,
          parametri: para ,
        };
      } ) ,
      switchMap( ( { sensor$ , parametri } ) => this.datasService.getForkJoinSensorData( parametri , sensor$ ) ) ,
      map( res => {

          res = [ ...res , ...res.map( ( { name , ...rest } ) => ( { ...rest , name: name.concat( ' - origin' ) } ) ) ]

          return addGetSensorDataAction( res )
        }
      )
    )
  );



  listenSetPeriodo$ = createEffect( () =>
    this.actions$.pipe(
      ofType( setPeriod ) ,
      map( ({value}) => resetPointActionDettaglio())
    )
  );


}
