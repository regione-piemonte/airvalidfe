/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import {BehaviorSubject, filter, finalize, map, mergeMap, Observable, of, switchMap, take, withLatestFrom,} from 'rxjs';
import {NgxSpinnerService} from 'ngx-spinner';
import {IParameter} from '@models/dataService';
import {ITimeSelected} from '@components/shared/validazione-dettaglio/models/time-selected.model';
import {IGrafico} from '@models/grafico';
import {Layout} from '@models/user-settinng.interface';
import {DatasService} from '@services/core/api';
import {DataService, LocalService, ThemeLayoutService} from '../../core/services';
import {DialogParametersComponent} from '@components/shared/dialogs/dialog-parameters/dialog-parameters.component';
import {Store} from "@ngrx/store";
import {AppState} from "../../state";
import {changesValidazioneSelector, graficiNascostiSelector, listGraficiSelector} from "@selectors/*";
import {registrazioneParametroAction} from "@actions/*";
import {IConfigDialogParameter, IData} from "@models/validazione";
import {format, setYear} from "date-fns";
import {IOutputData} from "angular-split";
import {DateSettingService} from "@services/core/utility/date-setting.service";
import {IVisibility} from "@components/shared/dialogs/dialog-remove-parameter/dialog-remove-parameter.component";
import {UtilityClass} from "@components/shared/utily/utily.class";
import {ExpandAreaService} from '@services/core/utility/expand-area.service'
import {INameColor} from "@components/shared/validazione-parametri/model/validazione-parametri.model";
import {IPropsParametriOut} from "@components/shared/validazione-parametri/validazione-parametri.component";
import {MatSnackBar} from "@angular/material/snack-bar";

type LayoutType = 'default' | 'reverse' | 'col';

type SideType = 'left' | 'right' | 'up' | 'down';

@Component({
  selector: 'app-validazione',
  templateUrl: './validazione.component.html',
  styleUrls: ['./validazione.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidazioneComponent implements OnInit {
  parameters$: Observable<Array<IParameter>> = new BehaviorSubject<Array<IParameter>>([]).pipe(take(1));
  dataset$ = new BehaviorSubject<IGrafico[] | null>(null);
  datasetDettaglio$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  visibilityNotValidDataSeries$ = new BehaviorSubject<IVisibility | null>(null);
  visibilitySeries$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  deleteSeries$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  changeColorSeries$ = new BehaviorSubject<INameColor>({name: '', color: ''});
  changeValueDataOutput$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  responseDataList: Array<Array<any>> = [];
  parameters: Array<IParameter> = [];
  validazioneLayout$?: Layout | null;
  validazioneLayoutBody$: any;
  changesStore$ = this.storeService.select(changesValidazioneSelector).pipe(
    filter(changes => !!changes.length),
  );

  constructor(
    private datasService: DatasService,
    private dialog: MatDialog,
    private dataService: DataService,
    private spinnerService: NgxSpinnerService,
    private layoutService: ThemeLayoutService,
    private storeService: Store<AppState>,
    private readonly localService: LocalService,
    private readonly settingDataService: DateSettingService,
    private readonly ref: ChangeDetectorRef,
    private readonly _expandAreaService: ExpandAreaService,
    private readonly slack: MatSnackBar,
  ) {
  }

  ngOnInit(): void {
    this.getLayoutConf();
    this.changesStore$.subscribe(changes => {
      let message = changes.map(item => item.name).join('\n\n');
      const additionalText = 'I seguenti parametri sono sbloccati:';
      const fullMessage = `${additionalText}\n\n${message}`;
      this.slack.dismiss();
      this.slack.open(fullMessage, '', {
        duration: 10000,
        panelClass: ['snackbar--info', 'snackback-line']
      });
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
      this.ref.detectChanges();
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
      this.ref.detectChanges();
    });
  }


  /**
   * Opens a dialog per la selezione dei parametri.
   *
   * @returns {void}
   */
  openDialogParameters(): void {
    const dialogConfig: MatDialogConfig<IConfigDialogParameter> = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1,
      title: 'Selezione parametri',
    };

    const dialogRef: MatDialogRef<DialogParametersComponent, IData> = this.dialog.open(DialogParametersComponent, dialogConfig);
    dialogRef.afterClosed()
      .subscribe((data) => {
        // console.info(data);
        let count = this.parameters.length;
        let {selected, all} = data!;
        this.parameters.push(
          ...all.filter(({name}) => selected.parametri
            .some(({name: nameSelected}) => nameSelected == name))
            .map((element) => this.dataService.createParameter(count, selected, element))
        );
        this.storeService.dispatch(registrazioneParametroAction({parametri: this.parameters, reload: false}));
        // this.parameters$.next(this.parameters);
        // this.getParams(this.parameters);
      });
  }

  getRow(event: Array<number> | number) {
    if (typeof event == 'number') {
      this.datasetDettaglio$.next(event);
    }
  }

  getLayoutConf() {
    // in una chiamata viene salvato il tipo di layout nell'altra la struttura - in modo che quando vengono modificate solo le dimensioni (changeSizeDefault) vengano inviate solo quelle informazioni in post
    this.layoutService.validazioneLayout$.subscribe((value) => {
      if (value) {
        this.validazioneLayout$ = value;
        this.validazioneLayoutBody$ = value;
      }
    });
  }

  getVisibility(event: any) {
    this.visibilitySeries$.next(event);
  }

  getVisibilityNotValid(event: IVisibility | null) {
    // console.info('event not valid', event);
    this.visibilityNotValidDataSeries$.next(event);
  }

  deleteSeries(event: string) {
    // console.info('deleteSeries', event);
    this.deleteSeries$.next(event);
    this.datasetDettaglio$.next(null);
  }

  changeColorSeries(event: INameColor) {
    // console.info('colorSerier', event);
    this.changeColorSeries$.next(event);
  }

  changeValueDataOutput(event: any) {
    // console.info('value', event);
    this.changeValueDataOutput$.next(event);
  }

  getParams({parametri, deleteAction = false, newParameters, reloadData}: IPropsParametriOut): void {

    let isNewParametersEmpty = !newParameters?.length;
    const arrayTimeSelected = this._getSensorDataForParameters(isNewParametersEmpty ? parametri : newParameters!);

    if (!parametri.length) {
      this.dataset$.next(null);
      this.visibilitySeries$.next(null);
    }


    this.storeService.select(listGraficiSelector)
      .pipe(
        take(1),
        filter((value) => !deleteAction),
        withLatestFrom(this.storeService.select(graficiNascostiSelector)),
        map(([graficiState, nascosti]) => ({graficiState, nascosti})),
        switchMap(({graficiState, nascosti}) => {
          this.spinnerService.show('global');

          if (!!nascosti.length) {
            graficiState = graficiState.map(grafico => !!nascosti.find(key => key === grafico.parametro.key) ? {...grafico, visible: false} : grafico);
          }

          return this.localService.getDataWithDataStore((start, end) => this.datasService.getForkJoinSensorData(isNewParametersEmpty ? parametri : newParameters!, arrayTimeSelected).pipe(
            mergeMap(grafici => {
              if (newParameters?.length) {
                return this.storeService.select(listGraficiSelector).pipe(
                  take(1),
                  map(old => [...old.filter(grafico => !grafico.name.includes('origin')), ...grafici])
                )
              }
              return graficiState.length ? of(graficiState.filter(grafico => !grafico.name.includes('origin')).map(graficoState => {
                if (grafici.some(grafico => grafico.key === graficoState.key)) {
                  return grafici.find(grafico => grafico.key === graficoState.key)!;
                }
                return graficoState;
              })) : of(grafici);
            }),
            map(grafici => ({grafici, start, end}))
          ))
        }),
        map(({grafici, start, end}) => {
          // Parametri non visibili
          let parametersNotVisible = parametri.filter(element => !element.visible);
          if (parametersNotVisible.length > 0) {
            parametersNotVisible.forEach(parametro => {
              // Indice Grafico
              let iGrafico = UtilityClass.getIndex(grafici, 'parametro', parametro.parametro.key, 'key');
              grafici[iGrafico].visible = parametro.visible;
            });
          }
          return {grafici, start, end};
        }),

        finalize(() => this.spinnerService.hide('global'))
      )
      .subscribe(({grafici, start, end}) => {
        this.responseDataList = [];
        grafici.forEach((grafico) => {
          if (grafico.parametro.key.includes('|')) {
            let anno = +format(new Date(+start), 'yyyy');
            grafico.dataset = JSON.parse(
              JSON.stringify(
                grafico.dataset.map((time) => {
                  return {
                    ...time,
                    timestamp: setYear(time.timestamp, anno).valueOf(),
                    timeFormat: this.settingDataService.formatDate(setYear(time.timestamp, anno)),
                  };
                })
              )
            );
          }
          this.responseDataList.push(grafico.dataset);
        });
        this.dataset$.next(grafici);
        this.ref.detectChanges();
      });
  }

  /**
   * Retrieves sensor data for the given parameters.
   *
   * @param {Array} parametri - An array of parameter objects.
   * @return {Array} - An array of promises that represent the asynchronous retrieval of sensor data.
   */
  private _getSensorDataForParameters(parametri: IParameter[]): Observable<Array<ITimeSelected>>[] {
    return parametri.map((element) => this.datasService.getSensorData(element.parametro.key, element.parametro.measurementPeriod));
  }

  onSplitAreaResize(event: IOutputData, layout: LayoutType, side?: SideType) {
    switch (layout) {
      case 'default':
        this.changeSizeDefault(event, layout, side);
        return;
      case 'col':
        this.changeSizeCol(event, layout);
        return;
      case 'reverse':
        // console.info(event, layout, side)
        this.changeSizeReverse(event, layout, side);
        return;
      default:
        break;
    }
  }

  private _getPrimoAndSecondoValore(evento: IOutputData) {
    let {sizes} = evento;
    let [primo, secondo, terzo] = sizes;
    return {
      primo: +primo,
      secondo: +secondo,
      terzo: +terzo
    }
  }

  changeSizeDefault(event: IOutputData, layout: keyof Layout, side?: SideType) {
    let size = {};


    if (side === 'left') {
      size = {
        slide_a: Math.round(this._getPrimoAndSecondoValore(event).primo),
        slide_b: Math.round(this._getPrimoAndSecondoValore(event).secondo),
        slide_c: Math.round(this.validazioneLayoutBody$.default.slide_c),
        slide_d: Math.round(this.validazioneLayoutBody$.default.slide_d)
      };
    } else {
      size = {
        slide_a: Math.round(this.validazioneLayoutBody$.default.slide_a),
        slide_b: Math.round(this.validazioneLayoutBody$.default.slide_b),
        slide_c: Math.round(this._getPrimoAndSecondoValore(event).primo),
        slide_d: Math.round(this._getPrimoAndSecondoValore(event).secondo),
      };
    }

    this.layoutService.setLayoutBody(size, layout)
  }

  changeSizeCol(event: IOutputData, layout: keyof Layout) {
    let size = {
      slide_a: Math.round(this._getPrimoAndSecondoValore(event).primo),
      slide_b: Math.round(this._getPrimoAndSecondoValore(event).secondo),
      slide_c: Math.round(this._getPrimoAndSecondoValore(event).terzo)
    };

    this.layoutService.setLayoutBody(size, layout);
  }

  changeSizeReverse(event: IOutputData, layout: keyof Layout, side?: SideType) {
    let size = {};
    if (side === 'right') {
      size = {
        slide_a: Math.round(this._getPrimoAndSecondoValore(event).primo),
        slide_b: Math.round(this._getPrimoAndSecondoValore(event).secondo),
        slide_c: Math.round(this.validazioneLayoutBody$.reverse.slide_c),
        slide_d: Math.round(this.validazioneLayoutBody$.reverse.slide_d)
      };
    } else {
      size = {
        slide_a: Math.round(this.validazioneLayoutBody$.reverse.slide_a),
        slide_b: Math.round(this.validazioneLayoutBody$.reverse.slide_b),
        slide_c: Math.round(this._getPrimoAndSecondoValore(event).primo),
        slide_d: Math.round(this._getPrimoAndSecondoValore(event).secondo)
      };
    }
    this.layoutService.setLayoutBody(size, layout);
  }
}

