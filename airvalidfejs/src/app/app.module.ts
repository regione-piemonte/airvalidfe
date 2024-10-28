/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {CUSTOM_ELEMENTS_SCHEMA, InjectionToken, LOCALE_ID, NgModule} from '@angular/core';
import {MAT_TOOLTIP_DEFAULT_OPTIONS} from '@angular/material/tooltip';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {CoreModule} from './core/core.module';
import {ViewsModule} from '@views/views.module';
import {LocalService} from './core/services';
import {NgxSpinnerModule} from 'ngx-spinner';
import {registerLocaleData} from '@angular/common';
import localeIt from '@angular/common/locales/it';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {HttpClient} from '@angular/common/http';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {IUserSetting} from '@models/user-settinng.interface';
import {Action, createReducer, StoreModule} from '@ngrx/store';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {environment} from '@environments/environment';
import {dettaglioReducer, dialogReducer, elaborazioneReducer, graficoReducer, parametriReducer, reportisticaReducer, validazioneReducer, taraturaReducer} from '@reducers/*';
import { EffectsModule} from '@ngrx/effects';
import {
  allEffectsParameters,
  DettaglioEffects,
  DialogParameterEffects,
  GraficoEffects,
  DialogTabelleEffects, DeleteReportisticaEffects,
} from './state/effects';
import {AppState, initStateIdTab, IResponseLimiti, resetStateActionState} from "./state";
import {IGrafico} from "@models/grafico";
import {ELABORAZIONIEFFECTSINDEX} from "./state/effects/elaborazioni";

registerLocaleData(localeIt);

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const SETTING = new InjectionToken<Array<IUserSetting>>('Setting');
export const LIMIT = new InjectionToken<Array<IResponseLimiti>>('Limit');

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NgxSpinnerModule,
    AppRoutingModule,
    CoreModule,
    ViewsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
      defaultLanguage: 'it',
    }),
    StoreModule.forRoot({
      idTab: createReducer(initStateIdTab),
      dialog: dialogReducer,
      grafico: graficoReducer,
      parametri: parametriReducer,
      dettaglio: dettaglioReducer,
      reportistica: reportisticaReducer,
      elaborazione: elaborazioneReducer,
      validazione: validazioneReducer,
      taratura: taraturaReducer,
    }, {
      metaReducers: [resetStateActionState],
    }),
    StoreDevtoolsModule.instrument({
      maxAge: 400, logOnly: environment.production,
      actionSanitizer: (action: Action, id: number) => {
        // @ts-ignore
        if (action.type === '[Grafico] Init Grafico' && action['grafici'].some(grafico => grafico.dataset.length > 500)) {
          return {
            ...action,
            // @ts-ignore
            grafici: action['grafici'].filter(({name}: IGrafico) => !name.includes('origin')).map(grafico => {
              if (grafico.dataset.length > 500) {
                grafico = {
                  ...grafico,
                  dataset: grafico.dataset.slice(0, 300)
                }
              }
              return grafico;
            })
          }
        }
        // @ts-ignore
        if (action.type === '[Dettaglio] Set Input Changed' && action['input']?.dataset?.length > 500) {
          // @ts-ignore
          let inputAction = action['input'];
          return {
            ...action,
            input: {
              ...inputAction,
              dataset: inputAction.dataset.slice(0, 300)
            }
          }
        }
        // @ts-ignore
        if (action.type === '[Dettaglio] Set Dataset' && action['value'].some(data => data.dataset.length > 500)) {
          // @ts-ignore
          let payloadAction = [...action['value']];
          return {
            ...action,
            value: payloadAction.map(data => ({...data, dataset: data.dataset.slice(0,300)}))
          }

        }
        return action;
      },
      stateSanitizer: (state: AppState, index: number) => {
        if (state.grafico.grafici.some(grafico => grafico.dataset.length > 500)) {
          //   Modifico lo state per evitare che mi possa caricare troppi dati
          state = {
            ...state,
            grafico: {
              ...state.grafico,
              grafici: state.grafico.grafici.filter(({name}) => !name.includes('origin')).map(grafico => ({...grafico, dataset: grafico.dataset.slice(0,300)}))
            }
          }
        }
        if (state.dettaglio.dataset.some(data => data.dataset.length > 500)) {
          state = {
            ...state,
            dettaglio: {
              ...state.dettaglio,
              dataset: state.dettaglio.dataset.map(data => ({...data, dataset: data.dataset.slice(0,300)})),
              input: {
                ...state.dettaglio.input,
                dataset: state.dettaglio.input?.dataset?.slice(0,300)
              }
            },
          }
        }
        return state;
      }
    }),
    EffectsModule.forRoot([...allEffectsParameters, ...ELABORAZIONIEFFECTSINDEX, GraficoEffects, DialogParameterEffects, DettaglioEffects, DialogTabelleEffects, DeleteReportisticaEffects]),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    LocalService,
    {provide: LOCALE_ID, useValue: 'it'},
    {
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: {
        showDelay: 2000, // Ritardo in millisecondi (1 secondo)
        hideDelay: 0,   // Nessun ritardo per nascondere il tooltip
        touchendHideDelay: 0, // Nessun ritardo per nascondere il tooltip al tocco (per dispositivi mobili)
      },
    },
    {
      provide: LIMIT,
      deps: [HttpClient],
      useFactory: (http: HttpClient) => {
        return http.get<Array<IResponseLimiti>>('./assets/json/parametri_limit.json');
      }
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
