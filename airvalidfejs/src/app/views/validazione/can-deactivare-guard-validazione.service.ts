/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot, UrlTree} from "@angular/router";
import {ValidazioneComponent} from "@views/validazione/validazione.component";
import {Observable} from "rxjs";
import {DataService} from "@services/core/data/data.service";
import {Injectable} from "@angular/core";
import {MatDialog} from "@angular/material/dialog";
import {DialogInfoComponent} from "@components/shared/dialogs/dialog-info/dialog-info.component";
import { TranslateService } from "@ngx-translate/core"

@Injectable()
export class CanDeactivateGuardValidazione implements CanDeactivate<ValidazioneComponent>{

  constructor(private readonly dateService: DataService, private dialog: MatDialog,private translateService: TranslateService) { }

  canDeactivate(component: ValidazioneComponent, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot, nextState?: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    let isSaved = !this.dateService.getIsSaved();
    if (!isSaved) {
      this.dialog.open(DialogInfoComponent, {
        data: {
          title: this.translateService.instant('dialog_not_remove.title'),
          message: this.translateService.instant('dialog_not_remove.body'),
        }
      })
    }

    return isSaved;
  }
}
