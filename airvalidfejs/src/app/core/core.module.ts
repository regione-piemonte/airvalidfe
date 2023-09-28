/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreComponentsModule } from './components/core-components.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthGuard } from './guards/auth.guard';
import { LoaderInterceptor } from './interceptors/loader/loader.interceptor';
import { TokenInterceptor } from './interceptors/token/token.interceptor';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [],
  imports: [CommonModule,CoreComponentsModule,RouterModule,HttpClientModule],
  exports: [CoreComponentsModule],
  providers: [
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
  ],
})
export class CoreModule {}
