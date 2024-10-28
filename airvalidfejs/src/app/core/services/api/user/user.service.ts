/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '@environments/environment';
import {DatalocksService} from '@services/core/api';

@Injectable({
  providedIn: 'root'
})
export class UserService {


  constructor(private readonly http: HttpClient, private readonly lockService: DatalocksService ,) {}

  getUserInfo(): Observable<any> {
    return this.http.get<any>(environment.apiEndpoint+"userinfo");
  }

  logout() {
    let ssoLogout = 'srpie_liv1_WRUP/Shibboleth.sso/Logout';
    return this.lockService.deleteUserStateLock()
    // return this.lockService.deleteUserStateLock().pipe(
    //   switchMap( ( response ) => {
    //       console.info( response , 'logout' );
    //       return this.http.get( `${ environment.baseUrl }${ environment.logout }`, { responseType: 'text'} ).pipe(
    //         map( res => ({message: 'logout eseguito'}) ),
    //       )
    //     }
    //   ) );
  }
}
