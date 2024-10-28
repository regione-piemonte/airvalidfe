/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CanDeactivateGuardValidazione} from "@views/validazione/can-deactivare-guard-validazione.service";

const routes: Routes = [
  {
    path: '',
    redirectTo: 'init-setting',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./views/login/login.module').then((m) => m.LoginModule),
    data: {
      title: 'Login'
    }
  },
  {
    path: 'init-setting',
    loadChildren: () =>
      import('./views/init-setting-page/init-setting-page.module').then((m) => m.InitSettingPageModule),

  },
  {
    path: 'validazione',
    loadChildren: () =>
      import('./views/validazione/validazione.module').then((m) => m.ValidazioneModule),
    canDeactivate:[CanDeactivateGuardValidazione],
    data: {
      title: 'Validazione'
    }
  },
  {
    path: 'reportistica',
    loadChildren: () =>
      import('./views/reportistica/reportistica.module').then((m) => m.ReportisticaModule),
    data: {
      title: 'Reportistica'
    }
  },

  {
    path: 'elaborazione',
    loadChildren: () =>
      import('./views/elaborazioni/elaborazioni.module').then((m) => m.ElaborazioniModule),
    data: {
      title: 'Elaborazioni'
    }
  },
  {
    path: 'impostazioni',
    loadChildren: () =>
      import('./views/impostazioni/impostazioni.module').then((m) => m.ImpostazioniModule),
    data: {
      title: 'Impostazioni utente'
    }
  },  {
    path: 'ricerca_eventi_anagrafica',
    loadChildren: () =>
      import('./views/ricerca-eventi-anagrafica/ricerca-eventi-anagrafica.module').then((m) => m.RicercaEventiAnagraficaModule),
    data: {
      title: 'Ricerca Eventi Anagrafica'
    }
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes,{})],
  exports: [RouterModule],
  providers:[CanDeactivateGuardValidazione]
})
export class AppRoutingModule { }
