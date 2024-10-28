import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, filter, map, Observable, Subject} from 'rxjs';
import {IUserSetting, Layout} from '@models/user-settinng.interface';
import {SettingsService} from '../api'
import {SETTING} from '../../../app.module';

@Injectable({
  providedIn: 'root'
})
export class UserSettingService {

  private settingSubject = new BehaviorSubject<IUserSetting | null>(null);
  public setting$ = this.settingSubject.asObservable();


  private notificaLayoutChange = new Subject<string>();
  layoutChanged$ = this.notificaLayoutChange.asObservable();

  private triggerSubject = new BehaviorSubject<boolean>(false);

  constructor(
    @Inject(SETTING) private setting: Array<IUserSetting>,
    private readonly httpService: HttpClient,
    private readonly settingService: SettingsService,
  ) {
    this.getConfigApp();
  }

  /**
   * @description Get the configuration
   *
   */
  getConfigApp(newConfig?: IUserSetting): void {

    let [assets, configBE] = this.setting;
    if (newConfig) configBE = newConfig
    if (assets && (!configBE || !Object.keys(configBE).length)) {
      this.settingSubject.next(assets);
    } else {
      this.settingSubject.next(configBE);
    }

  }


  /**
   * @description Get the current language
   * @returns {Observable<string>}
   */
  getLanguage(): Observable<string> {
    return this.setting$.pipe(
      filter(setting => setting !== null),
      map(setting => setting!.lang),
    );
  }


  /**
   * @description Get the current theme
   * @returns {Observable<string>}
   */
  getTheme(): Observable<string> {
    return this.setting$.pipe(
      filter((setting) => !!setting),
      map((setting) => setting!.theme),
    );
  }


  /**
   * @description Get the current font
   * @returns {Observable<string>}
   */
  getFont(): Observable<string> {
    return this.setting$.pipe(
      filter((setting) => !!setting),
      map((setting) => setting!.font),
    );
  }

  triggerLayoutChange(value: any) {
    this.notificaLayoutChange.next(value);
  }


  /**
   * @description Get the current layout
   * @returns {Observable<object>}
   */
  getLayout(): Observable<Layout> {
    return this.setting$.pipe(
      filter((setting) => !!setting),
      map((setting) => setting!.layout),
    );
  }


  /**
   * Sets the subject value for triggering an event.
   *
   * @param {boolean} data - The value to set for triggering the event.
   * @return {void}
   */
  setTriggerSubject(data: boolean): void {
    this.triggerSubject.next(data);
  }

  /**
   * Retrieves the trigger subject as an Observable.
   *
   * @returns {Observable} The trigger subject as an Observable.
   */
  getTriggerSubject(): Observable<boolean> {
    return this.triggerSubject.asObservable();
  }
}
