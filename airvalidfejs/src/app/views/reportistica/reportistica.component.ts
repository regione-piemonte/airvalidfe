/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Component, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig, MatDialogRef,} from '@angular/material/dialog';
import {BehaviorSubject, filter, map, Observable, of, pairwise, take, tap, withLatestFrom} from 'rxjs';
import {ExportCsvService, LocalService, ThemeLayoutService,} from '../../core/services';
import {DialogInitConfigComponent} from '@components/shared/dialogs/dialog-init-config/dialog-init-config.component';
import {DialogParametersComponent} from '@components/shared/dialogs/dialog-parameters/dialog-parameters.component';
import {DialogRenderTableComponent,} from '@components/shared/dialogs/dialog-render-table-component/dialog-render-table.component';
import {listaReportStandardAndControlli, listParametriReportisticaSelector, nextDialogSelector, reportSelezionatoElaborazioneSelector, stateToReportSelector,} from '@selectors/*';
import {AppState} from '../../state';
import {Store} from '@ngrx/store';
import {IResponseAllValidata, TypeValueToSpecialistico} from '@state/effects/*';
import {addParametriReportisticaAction, callReportStandardAction, callReportToDialogAction, deleteReportAction, initReportisticaAction, IPropsChangeLavoro,} from '@actions/*';
import {TranslateService} from '@ngx-translate/core';
import {IListReport, IListReportStandard, TypeSelectReport} from '@reducers/*';
import {IData} from '@models/validazione';
import {DataService} from '@services/core/data/data.service';
import {DialogRemoveReportComponent, TypeRecords} from '@components/shared/dialogs/dialog-remove-report/dialog-remove-report.component';

import {ResponseToReport} from "@models/response/report.interface";
import {ExpandAreaService} from '@services/core/utility/expand-area.service';
import {Layout} from '@models/user-settinng.interface'
import {startWith} from "rxjs/operators";
import {ToggleGroup} from "@dialog/*";
import {IParameter} from "@models/dataService";



@Component({
  selector: 'app-reportistica',
  templateUrl: './reportistica.component.html',
  styleUrls: ['./reportistica.component.scss'],
})
export class ReportisticaComponent implements OnInit {
  datasetDettaglio$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  parameters: Array<any> = [];
  validazioneLayout$!: Layout | null;
  validazioneLayoutBody$: any;
  stateToReportSelector$ = this.storeService.select(stateToReportSelector);
  stateToStandardAndControlliSelector$ = this.storeService.select(listaReportStandardAndControlli);
  displayedColumns: string[] = ['formato', 'valore_validato'];
  dataSource$?: Observable<{ periodo: IPropsChangeLavoro, report: Array<IResponseAllValidata>, key: string }>;
  titleTable?: string;
  dataStandardSource$?: Observable<{ periodo: IPropsChangeLavoro; formato: string; report: ResponseToReport; time: number }>;
  getAllCardState$: Observable<((IListReport & { type: ToggleGroup; key: string }) | IListReportStandard)[]> = this.getAllListState()
    .pipe(
      startWith([]),
      pairwise(),
      filter(([first, last]) =>  first.length !== last.length),
      map(([first, last]) => last.sort((firstA, firstB) => {
        return firstA.time - firstB.time
      }).reverse()),
      tap(data => console.info(data)),
      map(lista => {
        // Seleziono il primo elemento
        let [first, ...list] = lista;
        if (!!first && first.type.text === 'Controllo') {
          // Seleziono il primo elemento
          console.info(first, 'Controllo');
          this.renderItem(first, first.key!);
        }
        if (!!first && first.type.group === 'Standard') {
          // Seleziono il primo elemento che è standard
          console.info(first, 'Standard');
          this.renderStandardItem(first)
        }
        return lista;
      })
    )


  constructor(
    private readonly dataService: DataService,
    private dialog: MatDialog,
    private layoutService: ThemeLayoutService,
    private storeService: Store<AppState>,
    private _translateService: TranslateService,
    private readonly localService: LocalService,
    private readonly _expandAreaService: ExpandAreaService,
  ) {
  }




  ngOnInit(): void {
    this.storeService.dispatch(initReportisticaAction())
    this.getLayoutConf();
    this.storeService
      .select(nextDialogSelector)
      .pipe(
        filter((value) => !value.next),
        take(1)
      )
      .subscribe((value) => {
        this.openDialog();
      });
    this.storeService
      .select(listParametriReportisticaSelector)
      .pipe(
        filter((value) => !!value?.length),
        withLatestFrom(this.storeService.select(reportSelezionatoElaborazioneSelector)),
        map(([parametri, report]) => report),
      )
      .subscribe((value) => {
        // console.info(value);
        // this._openDialogSetViewRender();
        if (value.group === 'Controlli') {
          let props: TypeSelectReport = {
            text: value.text,
            value: value.value as TypeValueToSpecialistico
          }
          this.storeService.dispatch(callReportToDialogAction(props));
        }
        if (value.group === 'Standard') {
          // Creo una action per la richiesta del report standard
          console.info('chiamo standard');
          this.storeService.dispatch(callReportStandardAction(value));
        }
      });

    this.stateToStandardAndControlliSelector$.pipe(
      filter(state => !!state),
      map(state => {
        let controlli = Object.values(state.controlli).some(array => {

          if (Array.isArray(array)) {
            return array.some(item => item && this.periodMatches(item.periodo));
          }
          return false;
        });

        return {
          controlli,
          standard: state.standard?.length
        };
      })
    ).subscribe(({controlli, standard}) => {
      if (!controlli) {
        this.dataSource$ = undefined;
      }
      if (!standard) {
        this.dataStandardSource$ = undefined;
      }
    });

    // servizio che rimane in ascolto per modificare la larghezza delle colonne
    // per avere più spazio per grafici/tabelle
    this._expandAreaService.slideA$.subscribe(size => {
      if (this.validazioneLayout$) {
        switch (this.validazioneLayout$!.set) {
          case 'default':
            this.validazioneLayout$.default.slide_a = size;
            break;
          case 'reverse':
            this.validazioneLayout$!.reverse.slide_b = size;
          break;
          case 'col':
            this.validazioneLayout$!.col.slide_a = size;
          break;
          default:
          this.validazioneLayout$.default.slide_a = size;
            break;
        }

      }
    });

    this._expandAreaService.slideB$.subscribe(size => {
      if (this.validazioneLayout$) {
        switch (this.validazioneLayout$!.set) {
          case 'default':
          this.validazioneLayout$.default.slide_b = size;
            break;
          case 'reverse':
          this.validazioneLayout$!.reverse.slide_a = size;
          break;
          case 'col':
          this.validazioneLayout$!.col.slide_b = size;
          this.validazioneLayout$!.col.slide_c = size;
          break;
          default:
          this.validazioneLayout$.default.slide_b = size;
            break;
        }

      }
    });


  }

  private getAllListState(): Observable<Array<IListReport & { type: ToggleGroup, key: string } | IListReportStandard>> {
    return this.stateToStandardAndControlliSelector$.pipe(
      map(({controlli, standard = []}) => {

        let controlliKey = Object.keys(controlli).map(key => {
          // @ts-ignore
          if (controlli[key]){
            // @ts-ignore
            return [...controlli[key]?.map(controllo => ({...controllo, key}))]
          }

          return undefined

        }).filter(item => !!item);
        // Trasformo in lista controlli
        const controlliValues: Array<IListReport & {type: ToggleGroup, key: string}> = controlliKey.flat().filter(controllo => !!controllo).map(controllo => ({...controllo!,
        type: {
          text: 'Controllo',
          value: 'Controlli'
        }
        }))!;
        return [...controlliValues, ...standard];

      })
    )
  }

  private periodMatches(periodo: IPropsChangeLavoro): boolean {
    let matchingPeriod = false;
    this.dataSource$?.pipe(
      filter(({periodo}) => periodo !== undefined), // Filtra i valori undefined
      map(({periodo: periodo$}) => periodo$ === periodo), // Controlla se i periodi corrispondono
    ).subscribe(period => {
      matchingPeriod = period;
    });
    return matchingPeriod;
  }

  private _openDialogSetViewRender() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.panelClass = 'modal--render-table';
    dialogConfig.data = {
      id: 1,
      title: 'Selezione parametri',
    };

    const dialogRef = this.dialog.open<DialogRenderTableComponent, any, TypeSelectReport>(DialogRenderTableComponent, dialogConfig);
    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((data) => {
        // console.debug('data', data);
        this.storeService.dispatch(callReportToDialogAction(data!));
      });
  }

  openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1,
      title: 'Selezione parametri',
      showStep2: true,
      path: 'reportistica'
    };

    const dialogRef = this.dialog.open(DialogInitConfigComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((data) => {
      this.localService.setDateStore('lavoro', data.lavoro);
      this.openDialogParameters();
    });
  }

  /** Funzione per generare l'elenco dei parametri prendendo in considerazione
   * l'header della tabella - ciclando le varie row
   * nel caso in cui sia giornaliero prende come valore il primo nell'array
   * in caso di giornaliero o variabile prende il primo + secondo eliminando la stringa Parametro e Stazione
   **/
  getParameterList(data: any): string[] {
    const index = data.type?.value === 'daily' ? 0 : 1;
    const headerValues = Array.from(
      new Set<string>(
        data.report.tables
          .filter((item: { header: string | any[] }): item is { header: { value: string }[] } => !!item.header && item.header.length > 0)
          .map((item: { header: { value: string }[] }) => {
            let value = item.header[index]?.value as string;
            if (index === 0) {
              value = value + ' - ' + item.header[1]?.value as string;
            }
            if (index === 1) {
              const additionalValue = item.header[0]?.value as string;
              const processedValue = value?.replace(/^.*: /, '');
              const processedAdditionalValue = additionalValue?.replace(/^.*: /, '');

              value = processedValue ? processedValue + (processedAdditionalValue ? ' - ' + processedAdditionalValue : '') : processedAdditionalValue || '';

            }
            return value;
          })
      )
    );

    // Sort header values alphabetically
    headerValues.sort((a, b) => a.localeCompare(b));


    return headerValues;
  }


  removeReport() {
    // Ottieni lo stato corrente dei report dallo store
    let currentState: TypeRecords | undefined;
    // @ts-ignore
    this.stateToReportSelector$.pipe(take(1)).subscribe(state => {
      // @ts-ignore
      currentState = state;

      this.storeService.dispatch(deleteReportAction(currentState as TypeRecords)); // <-- Cast a TypeRecords
    });
  }


  openDialogRemove() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1,
      title: 'Elimina report',
    };

    const dialogRef = this.dialog.open(
      DialogRemoveReportComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((data) => {
      // console.info('data', data)
    });
  }

  openDialogParameters() {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1,
      title: 'Selezione parametri',
    };

    const dialogRef: MatDialogRef<DialogParametersComponent, IData> =
      this.dialog.open(DialogParametersComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((data) => {
      let {selected, all} = data!;

      let params: IParameter[] = [];

      // Nel caso che all sia vuoto
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

      this.storeService.dispatch(addParametriReportisticaAction(params));

    });

  }

  getRow(event: Array<number> | number) {
    if (typeof event == 'number') {
      this.datasetDettaglio$.next(event);
    }
  }

  getLayoutConf() {
    this.layoutService.validazioneLayout$.subscribe(
      (value) => {
        if (value) {
          this.validazioneLayout$ = value
        }
      });
    this.layoutService.validazioneLayout$.subscribe((value) => {
      if (value) {
        this.validazioneLayoutBody$ = value;
      }
    });
  }

  titleDateTime(date: any): string {
    return (
      this._translateService.instant(
        'page.reportistica.split_right.title_accordion'
      ) + date
    );
  }

  checkIfAnyReportExists<T>(data: T): boolean {
    return Object.values(data).some(array => array && Array.isArray(array) && array.length > 0);
  }

  getTitle(key: string): string {
    const translationMap: { [key: string]: string } = {
      listAssenti: 'page.reportistica.split_right.listAssenti',
      listCertified: 'page.reportistica.split_right.listCertified',
      listNotCertified: 'page.reportistica.split_right.listNotCertified',
      listValidata: 'page.reportistica.split_right.listValidata',
      listNotValid: 'page.reportistica.split_right.listNotValid',
      listValidationNull: 'page.reportistica.split_right.listValidationNull',
      listIpaMetalli: 'page.reportistica.split_right.listIpaMetalli',
      listDaRivedere: 'page.reportistica.split_right.listDaRivedere',
    };

    return this._translateService.instant(translationMap[key] || key);
  }

  standardFlag(key: boolean): string {

    const translateKey: string = key ? 'levelSelect.0.name' : 'levelSelect.1.name';

    return this._translateService.instant(translateKey);
  }

  renderItem<T extends IListReport & {type: ToggleGroup; key: string} | IListReportStandard>( item: T, key: string): void {


    const {formato, report, periodo} = item;
    this.titleTable = formato;
    this.dataSource$ = of({report: report as IResponseAllValidata[], periodo, key});
    this.dataStandardSource$ = undefined;
  }

  renderStandardItem(standard: IListReportStandard | IListReport & {type: ToggleGroup}) {
    this.dataSource$ = undefined;
    this.titleTable = standard.formato;
    if (standard.type.text !== 'Controllo') {
      this.dataStandardSource$ = of({...standard as IListReportStandard});
    }
  }

  getArray(report: Array<IResponseAllValidata> | ResponseToReport) {
    if (Array.isArray(report)) {
      return report
    }
    return []
  }

}
