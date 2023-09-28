/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'validazione',
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
    path: 'validazione',
    loadChildren: () =>
      import('./views/validazione/validazione.module').then((m) => m.ValidazioneModule),
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
    path: 'elaborazioni',
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
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
