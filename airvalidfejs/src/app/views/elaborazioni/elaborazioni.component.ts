/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, QueryList, ViewChild, ViewChildren, ViewContainerRef} from '@angular/core';
import {MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import {BehaviorSubject, filter, take,} from 'rxjs';
import {DataService, ThemeLayoutService} from '../../core/services';
import {AppState} from "../../state";
import {Store} from "@ngrx/store";
import {addGraficoElaborazioneAction, addParametriElaborazioniAction} from "@actions/*";
import {listaGraficiElaborazioniSelector, parametriElaborazioneSelector} from '@selectors/*'
import {FormBuilder, FormGroup} from '@angular/forms'
import {Layout} from "@models/user-settinng.interface";
import {ElaborazioniGraficoComponent} from "@views/elaborazioni/elaborazioni-grafico/elaborazioni-grafico.component";
import {DialogParametersComponent} from "@components/shared/dialogs/dialog-parameters/dialog-parameters.component";
import {IData} from "@models/validazione";
import {IGraficiElaborazioni} from "@reducers/*";
import {IOutputData} from 'angular-split'
import {ExpandAreaService} from '@services/core/utility/expand-area.service'

type LayoutType = 'default' | 'reverse' | 'col';

type SideType = 'left' | 'right' | 'up' | 'down';

export interface ISelectRender {
  value: string;
  group: string;
  sub_group: string;
  text: string;
  isSelected?: boolean;
}

@Component({
  selector: 'app-elaborazioni',
  templateUrl: './elaborazioni.component.html',
  styleUrls: ['./elaborazioni.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElaborazioniComponent implements OnInit, AfterViewInit {

  @ViewChild('grafico', {read: ViewContainerRef}) grafico?: ViewContainerRef;
  @ViewChildren(ElaborazioniGraficoComponent) graficiElaborazioni?: QueryList<ElaborazioniGraficoComponent>;
  graficiStore$ = this.storeService.select(listaGraficiElaborazioniSelector);

  datasetDettaglio$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  parameters: Array<any> = [];
  validazioneLayout$?: Layout | null;
  validazioneLayoutBody$: any;
  form: FormGroup = this._getForm();


  constructor(
    private dataService: DataService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private layoutService: ThemeLayoutService,
    private readonly storeService: Store<AppState>,
    private readonly cdref: ChangeDetectorRef,
    private readonly _expandAreaService:ExpandAreaService
  ) {

  }

  private _getForm(): FormGroup {
    return this.fb.group({
      tipoGrafico: ['']
    });
  }


  ngOnInit(): void {
    this.getLayoutConf();
    this.deleteParametro();
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
      this.cdref.markForCheck();
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
      this.cdref.markForCheck();
    });
  }

  ngAfterViewInit() {
    if (!this.grafico?.length) {
      this.addGrafico();
      this.cdref.detectChanges();
    }
  }

  /**
   * La funzione `getRow` che accetta un evento di tipo `Array<number>` o `number`.
   * Se il tipo dell'evento è `number`, invia l'evento al Subject `datasetDettaglio$`.
   * @param {Array<number> | number} event - L'input può essere un array di numeri o un numero.
   */
  getRow(event: Array<number> | number) {
    if (typeof event == 'number') {
      this.datasetDettaglio$.next(event);
    }
  }

  getLayoutConf() {
    this.layoutService.validazioneLayout$.subscribe((value) => {
      if (value) {
        this.validazioneLayout$ = value
      }
    });
    this.layoutService.validazioneLayout$.subscribe((value) => {
      if (value) {
        this.validazioneLayoutBody$ = value;
      }
    });
    this.cdref.markForCheck();
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


  /**
  * @description Aggiunge un nuovo grafico alla elaborazione
  */
  addGrafico() {

    this.storeService.select(listaGraficiElaborazioniSelector)
      .pipe(
       take(1),
        filter(lista => !lista.length || !lista.some(grafico => grafico.tipo.includes('new')))
      )
      .subscribe(lista => {
        this.createGraficoComponent(lista);
      });
  }

  private createGraficoComponent(lista: Array<IGraficiElaborazioni>) {
    let component = this.grafico?.createComponent(ElaborazioniGraficoComponent);
    let data = Date.now();
    component!.instance.grafico = {
      tipo: 'newGraphic',
      active: true,
      data: [],
      indexTime: data
    }
    component!.instance.index = lista.length
    this.storeService.dispatch(addGraficoElaborazioneAction('newGraphic', data));
    component!.instance.closed.subscribe(index => this.grafico?.remove(index));
  }

  deleteParametro() {
    this.storeService.select(parametriElaborazioneSelector)
      .pipe(
        filter(parametri => !!this.grafico?.length)
      )
      .subscribe(parametri => {
        if (!parametri.length) {
          this.grafico?.clear();
          this.openDialogParameters();
        }
      })
  }

  openDialogParameters() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1,
      title: 'Selezione parametri',
    };
    this.createGraficoComponent([]);

    const dialogRef: MatDialogRef<DialogParametersComponent, IData> = this.dialog.open(DialogParametersComponent, dialogConfig);
    dialogRef.afterClosed()
      .pipe(
        filter(data => !!data),
      )
      .subscribe((data) => {
      // console.info(data);
      let {selected, all} = data!;
      let params = [
        ...all.filter(({name}) => selected.parametri
          .some(({name: nameSelected}) => nameSelected === name))
          .map((element) => this.dataService.createParameter(0, selected, element))
      ];
      this.storeService.dispatch(addParametriElaborazioniAction(params))
    });
  }






}
