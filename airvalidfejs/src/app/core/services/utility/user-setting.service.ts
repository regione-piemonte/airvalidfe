import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { filter , map , Observable , take } from 'rxjs';
import { IUserSetting,Col,Layout } from '../../models/user-settinng.interface';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserSettingService {


  setting  = this.httpService.get<IUserSetting>('./assets/json/settings.json');

  constructor(
    private readonly httpService: HttpClient ,
  ) { }

  /**
   * @description Get the current language
   * @returns {Observable<string>}
   */
  getLanguage(): Observable<string> {
    return this.setting.pipe(
      filter((setting) => !!setting),
      map(({lang}) => lang),
      tap((lang) => console.info('lang', lang))
    );
  }

  /**
   * @description Get the current theme
   * @returns {Observable<string>}
   */
  getTheme(): Observable<string> {
    return this.setting.pipe(
      filter((setting) => !!setting),
      map(({theme}) => theme),
      tap((theme) => console.info('theme', theme))
    );
  }

    /**
   * @description Get the current font
   * @returns {Observable<string>}
   */
  getFont(): Observable<string> {
    return this.setting.pipe(
      filter((setting) => !!setting),
      map(({font}) => font),
      tap((font) => console.info('font', font))
    );
  }

    /**
   * @description Get the current layout
   * @returns {Observable<object>}
   */

  getLayout(): Observable<Layout> {
    return this.setting.pipe(
      filter((setting) => !!setting),
      map(({layout}) => layout),
      tap((layout) => console.info('layout', layout))
    );
  }

}
