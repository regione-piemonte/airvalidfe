import {ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import {Store} from "@ngrx/store";
import {AppState} from "../../../state";
import {indexDettaglioElaborazioneSelector, parametriElaborazioneSelector} from "@selectors/*";
import {IParameter} from "@models/dataService";
import {filter, map, take, withLatestFrom} from "rxjs";
import {
  addNewParameterToListElaborazioneAction, callParametroCorrelatoElaborazioneAction, deleteParametroElaborazioneAction, deleteParametroToMenuElaborazioniAction,
  resetStateElaborazione,
  selectParametroElaborazioneAction,
  selectTableDettaglioElaborazioneAction,
  visibilityElaborazioneAction
} from "@actions/*";
import {DialogService} from "@components/shared/dialogs/services/dialog.service";
import {MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog'
import {DialogRemoveParameterComponent} from '@components/shared/dialogs/dialog-remove-parameter/dialog-remove-parameter.component'
import {DialogParametersComponent} from "@components/shared/dialogs/dialog-parameters/dialog-parameters.component";
import {IData} from "@models/validazione";
import {DataService} from "@services/core/data/data.service";
import {UtilityClass} from "@components/shared/utily/utily.class";
import {MatMenuTrigger} from "@angular/material/menu";
import {ActionParametersType} from "@models/utils_type";
import {NgxSpinnerService} from "ngx-spinner";

@Component({
  selector: 'lista-parametri',
  templateUrl: './parametri.component.html',
  styleUrls: ['./parametri.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParametriComponent implements OnInit {

  @ViewChild(MatMenuTrigger) contextMenu?: MatMenuTrigger;

  parametri$ = this.storeService.select(parametriElaborazioneSelector)
  displayedColumns: string[] = ['parametro', 'stazione', 'azione'];
  clickedRows = new Set<IParameter>();
  parametroSelezionato$ = this.storeService.select(indexDettaglioElaborazioneSelector);
  contextMenuPosition = {x: '0px', y: '0px'};

  constructor(
    private readonly dialog: MatDialog,
    private readonly storeService: Store<AppState>,
    private readonly dialogService: DialogService,
    private readonly dataService: DataService,
    private spinnerService: NgxSpinnerService,
  ) {
  }

  ngOnInit(): void {
  }

  addAndDelete(row: IParameter, index: number): void {
    console.info(row);
    this.storeService.dispatch(selectTableDettaglioElaborazioneAction(row.parametro.key));
  }

  openDialogDeleteAll() {
    this.dialogService
      .openInfoDialog(
        'Attenzione',
        "Procedere con l'eliminazione di tutti i parametri?",
        'Elimina'
      )
      .pipe(filter((res) => !!res))
      .subscribe({
        next: () => {
          //  Elimina tutto la lista dei parametri
          this.storeService.dispatch(resetStateElaborazione());
        },
      });
  }

  openRemoveParameterDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1,
      title: 'Rimuovi Parametri',
    };

    const dialogRef = this.dialog.open(
      DialogRemoveParameterComponent,
      dialogConfig
    );
  }

  openEditParameterDialog(element: IParameter, event: MouseEvent) {
    event.stopPropagation();
    console.info(element);
    if (this.clickedRows.has(element)) {
      this.clickedRows.delete(element);
    } else {
      this.clickedRows.add(element);
    }
    this.storeService.dispatch(visibilityElaborazioneAction(Array.from(this.clickedRows)));
    this.storeService.dispatch(selectParametroElaborazioneAction({...element, visible: !element.visible}));
  }

  openAddParameterDialog() {
    // Apri modale per aggiunta parametro
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1,
      title: 'Selezione parametri',
    };

    const dialogRef: MatDialogRef<DialogParametersComponent, IData> =
      this.dialog.open(DialogParametersComponent, dialogConfig);
    dialogRef.afterClosed()
      .pipe(
        withLatestFrom(this.storeService.select(parametriElaborazioneSelector)),
        map(([data, parametriStore]) => ({data, parametriStore}))
      )
      .subscribe(({data, parametriStore}) => {
        let {selected, all} = data!;
        let params: IParameter[] = [];

        if (all.length === 0) {
          params = selected.parametri.map((element, i) => {
            return this.dataService.createParameter(i, selected, element);
          })
        }else{
          params = [
            ...all.filter(({name}) => selected.parametri
              .some(({name: nameSelected}) => nameSelected === name))
              .map((element) => this.dataService.createParameter(0, selected, element))
          ];
        }

        // Prendo i due array e li unisco
        let uniqueArray = UtilityClass.getElementToLastList(parametriStore, params);
        if (uniqueArray.length > 0) {
          this.storeService.dispatch(addNewParameterToListElaborazioneAction(uniqueArray));
        }

      });


  }

  openMemu(evento: MouseEvent, item: IParameter) {
    evento.preventDefault();
    evento.stopPropagation();

    this.parametroSelezionato$.pipe(
      take(1),
    ).subscribe(key => {
      // Verifico che ci sia un parametro selezionato e che sia quello su qui ho aperto il menu
      if (key && key === item.parametro.key) {
        // Nel caso che ci sia selezionato allora apro il menu
        this.contextMenuPosition.x = evento.clientX + 'px';
        this.contextMenuPosition.y = evento.clientY + 'px';
        if (this.contextMenu) {
          this.contextMenu.menuData = {item: item};
        }

        // this.contextMenu?.menu.focusFirstItem('mouse');
        this.contextMenu?.openMenu();
      }
    })



  }

  onContextMenuAction(item: IParameter, action: ActionParametersType) {
    console.info({item, action});
    switch (action) {
      case "confronta":
        break;
      case "delete":
        this.storeService.dispatch(deleteParametroToMenuElaborazioniAction(item));
        break;
      case "showOriginData":
        break;
      case "showNotValidData":
        break;
      case "taratura":
        break;
      case "color-picker":
        break;
      case "parametri-correlati":
        this.storeService.dispatch(callParametroCorrelatoElaborazioneAction(item.parametro.key))
        break;
      case "notShowNotValidData":
        break;
    }

  }
}
