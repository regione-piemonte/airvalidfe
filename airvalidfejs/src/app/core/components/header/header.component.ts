/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {delay, filter, map, Observable} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {LanguageService} from '../../services/locale/language.service';
import {UserService} from '@services/core/api';
import {ThemeColorService} from '../../services/utility/theme-color.service';
import {DialogSettingsComponent} from '@components/shared/dialogs/dialog-settings/dialog-settings.component';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog'
import {ThemeFontService} from '@services/core/utility/theme-font.service';
import {NgxSpinnerService} from 'ngx-spinner';
import {environment} from '@environments/environment';
import {finalize} from 'rxjs/operators';
import {LocalService} from "@services/core/locale/local.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  translatedText: any;

  supportedLanguages = [
    {value:'gb', name: 'English'},
    {value:'it', name: 'Italiano'}]; // Aggiungi le lingue supportate
  selectedLanguage = 'it'; // Lingua predefinita

  titlePage!: string;
  fontSizeSelect = 'regular';
  fontSizes: any;
  themeSelect = 'light';
  themeColors = [
    {size: 'Light', value: 'light'},
    {size: 'Dark', value: 'dark'},
  ]

  user$:Observable<any>=new Observable<any>()
  constructor(
    private router: Router,
    private titleService: Title,
    private translateService: TranslateService,
    private languageService: LanguageService,
    private userService: UserService,
    private dialog: MatDialog,
    private _themeFontService: ThemeFontService,
    private _themeColorService: ThemeColorService,
    private spinner: NgxSpinnerService,
    private readonly localService: LocalService
  ) {}

  ngOnInit() {

    // this.changeTheme();

    this.user$=this.userService.getUserInfo();
    this.languageService.currentLanguage$.subscribe((language: string) => {
      this.selectedLanguage = language;
      this.translateService.getTranslation(language).subscribe((res: any) => {
        this.fontSizes = res.input.font.option;
      });
    });
    this._themeFontService.currentFont$.subscribe((value: string) => {
      this.fontSizeSelect = value;
    });
    this._themeColorService.currentColor$.subscribe((value: string) => {
      this.themeSelect = value;
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route: ActivatedRoute = this.router.routerState.root;
          let routeTitle = '';
          while (route!.firstChild) {
            route = route.firstChild;
          }
          if (route.snapshot.data['title']) {
            routeTitle = route!.snapshot.data['title'];
          }
          return routeTitle;
        })
      )
      .subscribe((title: string) => {
        if (title) {
          this.titleService.setTitle(`Ariaweb - ${title}`);
          this.titlePage = title;
        }
      });
  }

  openDialogSettings() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1,
      title: 'Selezione parametri',
    };

    const dialogRef = this.dialog.open(DialogSettingsComponent, dialogConfig);
  }

  changeLanguage() {
    this.languageService.setLanguage(this.selectedLanguage);
  }

  changeSize() {
    this._themeFontService.setThemeFont(this.fontSizeSelect);

  }

  changeTheme() {
    this._themeColorService.setThemeColor(this.themeSelect);
  }

  logout() {
    this.spinner.show( 'global' );

    this.userService.logout()
      .pipe(
        delay(5000),
        finalize(() => this.spinner.hide('global'))
      )
      .subscribe((res) => {
        this.localService.clear();
        document.cookie = '';
        location.replace(environment.baseUrl + environment.logout );
    });
  }
}
