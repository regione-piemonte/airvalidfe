import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit} from '@angular/core';
import {filter, map, Observable, switchMap, take, withLatestFrom} from "rxjs";
import {activateGraficoElaborazioneAction, attivoGraficoElaborazioneAction, changeValoreFlagVerificationLevel, removeGraficoElaborazioniAction, setTypeGraficoElaborazioneAction} from "@actions/*";
import {EChartsOption, EChartsType} from "echarts";
import {LineChart} from "echarts/charts";
import {DataZoomComponent, GridComponent, LegendComponent, TitleComponent, ToolboxComponent, TooltipComponent} from "echarts/components";
import {IGraficiElaborazioni} from "@reducers/*";
import {LanguageService} from "@services/core/locale/language.service";
import {TranslateService} from "@ngx-translate/core";
import {AppState} from "../../../state";
import {Store} from "@ngrx/store";
import {elaborazionePeriodoSelector, listaGraficiElaborazioniSelector, listaVisibilityElaborazioneSelector, parametroSelezionatoElaborazioneSelector} from "@selectors/*";
import {NgxSpinnerService} from "ngx-spinner";
import {formatDate} from "@angular/common";
import {AxisPointerOption} from "echarts/types/dist/shared";
import {DateSettingService, TimeResponseEnum} from "@services/core/utility/date-setting.service";
import {IParameter} from "@models/dataService";
import IResponseReportistica from "@services/core/api/reportistica/models/getReportistica.model";
import {ToggleGroup} from "@dialog/*";
import {IDataToTransform, IValueSelect} from "@views/elaborazioni/elaborazioni-grafico/elaborazioni-grafico.model";

type IOptSerie = Array<{ idSerie: string, name: string }>;
type IOptLegend = Array<{ selected: Record<string, boolean> }>;
type IOptionGrafico = { series: IOptSerie; legend: IOptLegend };



@Component({
  selector: 'elaborazioni-grafico',
  templateUrl: './elaborazioni-grafico.component.html',
  styleUrls: ['./elaborazioni-grafico.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElaborazioniGraficoComponent implements OnInit {
  @Input() grafico!: IGraficiElaborazioni;
  @Input() index!: number;

  private echartinstance!: EChartsType;
  echartsExtentions: any[];
  echartsOptions = this._createOpt();
  elaborationChoiceType: Observable<Array<ToggleGroup>> = this._languageService.currentLanguage$
    .pipe(
      switchMap(language => this._translateService.getTranslation(language)),
      map(response => response.button.group.scelta_elaborazione.toggle_group),
      take(1),
    );
  selectedRender: ToggleGroup = {value: '', text: ''};
  periodo = {startDate: '', endDate: ''};
  closed: EventEmitter<number> = new EventEmitter();
  selectedMaterial: number = 2;
  materials: Array<IValueSelect> = ElaborazioniGraficoComponent.getOptions();


  constructor(
    private readonly _languageService: LanguageService,
    private readonly _translateService: TranslateService,
    private readonly storeService: Store<AppState>,
    private readonly spinnerService: NgxSpinnerService,
    private readonly dataSetting: DateSettingService,
    private readonly ref: ChangeDetectorRef,
  ) {
    this.echartsExtentions = [
      LineChart,
      GridComponent,
      LegendComponent,
      TooltipComponent,
      TitleComponent,
      ToolboxComponent,
      DataZoomComponent
    ];
  }

  /**
   * @description Metodo statico per le opzioni del selector
   */
  static getOptions(): Array<IValueSelect> {
    return [
      {name: 'Dati validati', value: 2},
      {name: 'Dati non ancora validati', value: 3},
      {name: 'Dati certificati', value: 1},

    ]
  }

  ngOnInit(): void {
    // console.info(`init per il  ${this.grafico?.tipo} con index ${this.index}`);
    this.storeService.select(listaGraficiElaborazioniSelector)
      .pipe(
        switchMap((grafici) => grafici),
        filter((grafico) => {
          return this.grafico.tipo === grafico.tipo && grafico.indexTime === this.grafico.indexTime
        }),
        withLatestFrom(this.storeService.select(listaVisibilityElaborazioneSelector)),
        map(([grafico, parametri]) => ({grafico, parametri}))
      )
      .subscribe(({grafico, parametri}) => {
        let {data, indexTime, tipo, active} = grafico;
        this.grafico.active = active
        let isActive = data.length && active;
        let transformData = this._transformData(data);
        let arrayLength = data.length && transformData.length !== this._getChartOptions().series.length;
        let timeBaseNone = transformData.length && transformData.every(item => item.timebase === 'NONE');
        if (timeBaseNone){
          this.spinnerService.hide('global');
          this.echartinstance.setOption({
            title: {
              text: 'Grafico non disponibile',
              subtext: `Periodo considerato ${this.periodo.startDate} - ${this.periodo.endDate}`,
              top: '40%'
          },
            toolbox: {
              show: false,
            },
            series: []

          }, {replaceMerge:['series']});
        } else if (isActive || arrayLength  ) {
          this._createSerie({tipo, data, active, indexTime});
          this._setVisibleLegend(parametri);
        }
        this.ref.detectChanges();
      });
    this.storeService.select(elaborazionePeriodoSelector)
      .pipe(
        take(1)
      ).subscribe(({endDate, startDate}) => {
      this.periodo = {
        startDate: formatDate(+startDate, 'short', 'it'),
        endDate: formatDate(+endDate, 'short', 'it'),
      }
    });

    this.storeService.select(parametroSelezionatoElaborazioneSelector)
      .pipe(
        filter((elaborazione) => !!this.echartinstance && !!elaborazione)
      )
      .subscribe(parametro => this.toggleLegendSelection(parametro));

  }

  private _setVisibleLegend(parametri: Array<IParameter>) {
    let {legend, series} = this._getChartOptions();
    let [primo] = legend;
    let {selected} = primo;
    let newRecord: Record<string, boolean> = {}
    parametri.forEach(({parametro}) => series.filter(serie => serie.idSerie === parametro.key).forEach(({name}) => newRecord[name] = false));
    newRecord = {...selected, ...newRecord};
    this.echartinstance.setOption({
      legend: [{
        selected: newRecord
      }]
    })
  }

  private toggleLegendSelection(parametro?: IParameter) {
    let {series, legend} = this._getChartOptions();
    let map = legend[0].selected;
    let seriesNames = series.filter(item => parametro?.parametro.key === item.idSerie).map(serie => serie.name);

    if (seriesNames.length && map) {
      seriesNames.forEach(nameSerie => {
        this.echartinstance.dispatchAction({
          type: 'legendToggleSelect',
          name: nameSerie
        })
      })

    }
    console.info(series);
  }

  private _getChartOptions(): IOptionGrafico {
    if (this.echartinstance) {
      return this.echartinstance.getOption() as IOptionGrafico;
    }
    return {series: [], legend: []};
  }

  static createAxisPointer(testo?: string): AxisPointerOption {
    return {
      label: {
        formatter: function (value) {
          if (value && value.seriesData.length) {
            return value.seriesData[0].name
          }
          return `Test function ${testo}`;
        }
      }
    };
  }

  private _createOpt(): EChartsOption {
    return {
      legend: {
        show: false
      },
      title: {
        text: '',
        subtext: '',
        left: 'center'
      },
      toolbox: {
        feature: {
          dataZoom: {
            iconStyle: {
              borderColor: '#005CA9',
              borderWidth: 1
            },
            emphasis: {
              iconStyle: {
                borderColor: '#005CA9',
                borderWidth: 2.5
              }
            },
            brushStyle: {
              color: '#006cb3',
              opacity: 0.3,
              borderColor: '#006cb3',
              borderWidth: 1
            }
          },
          restore: {
            show: false
          },
          //saveAsImage: {}
        },
        iconStyle: {
          borderColor: '#005CA9',
          borderWidth: 1
        },
        emphasis: {
          iconStyle: {
            borderColor: '#005CA9',
            borderWidth: 2.5
          }
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        trigger: 'axis',
        order:'valueDesc',
        axisPointer: ElaborazioniGraficoComponent.createAxisPointer(),
        position: function (pos, params, dom, rect, size) {
          // tooltip will be fixed on the right if mouse hovering on the left,
          // and on the left if hovering on the right.
          let obj = {top: 60};
          //@ts-ignore
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 5;
          return obj;
        }
      },
      grid:{
        left: '3%',
        right: '3%',
      },
      xAxis: {
        type: 'time',
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        // boundaryGap: [0, '100%'],
        splitLine: {
          show: true
        },
      },
      dataZoom:{
        showDetail: false
      },
      series: [],
      useUTC: true
    };
  }

  private  hasTimeToResponse<T extends IDataToTransform>(list:Array<T>,value: TimeResponseEnum): boolean{
    return list.every(item => item.timebase === value)
  }

  private _createSerie({data, indexTime}: IGraficiElaborazioni) {
    let seriesData = this._transformData(data);
    let ecBasicOption = this.echartinstance.getOption();
    this.echartinstance.clear();
    this.echartinstance.setOption(ecBasicOption);




    this.echartinstance.setOption({
      title: {
        text: data[0].description,
        subtext: `Periodo considerato ${this.periodo.startDate} - ${this.periodo.endDate}`,
        top: ''
      },
      tooltip: {
        axisPointer: ElaborazioniGraficoComponent.createAxisPointer('proviamo'),
      },
      series: [...seriesData],
      toolbox: {
        show: true
      },
      xAxis:{
        axisLabel:{
          formatter: this.hasTimeToResponse(seriesData, TimeResponseEnum.WEEKTIME) ? '{ee}' : null
        }
      },
    }, {
      replaceMerge: ['series'],
    });

    this.spinnerService.hide('global')
  }

  private _transformData(data: Array<IResponseReportistica>):Array<IDataToTransform> {
    let serieFlat = data.map(item => ({...item, listResult: item.listResult?.map(list => ({...list, idSerie: item.id}))})).map(map => map.listResult).flat();
    return serieFlat.map((serie) => {
      let serieData = serie?.values?.map(item => !item ? {value: null, timestamp: null, error: null} : item).map(({value: valueSerie, timestamp, error}) => ({
        name: this.dataSetting.getFormatterToTimeBase(timestamp! + (60 * 60 * 1000), serie.timebase!),
        value: [timestamp !== null ? timestamp! + (60 * 60 * 1000) : timestamp, valueSerie]
      }));
      return {
        idSerie: serie?.idSerie,
        name: serie?.name,
        showSymbol: serieData && serieData.length < 100,
        symbol: 'circle',
        symbolSize: 8,
        type: 'line',
        lineStyle: {
          width: 1.5,
        },
        timebase: serie!.timebase,
        data: serieData
      }

    });
  }

  updateValue(value: ToggleGroup) {
    this.spinnerService.show('global');
    if (this.selectedRender) {
      this.selectedRender.isSelected = false;
    }
    this.selectedRender = value
    this.selectedRender.isSelected = true;
    this.grafico = {
      ...this.grafico,
      tipo: value.value
    }
    // this.form.get('tipoGrafico')!.setValue(value.value);
    this.storeService.dispatch(setTypeGraficoElaborazioneAction(value.value, this.selectedMaterial));
  }

  chartInit(event: any) {
    // console.info(event, `Init per il grafico ${this.index}`);
    if (!this.echartinstance) {
      this.echartinstance = event;
      this.echartinstance?.on('restore', (event) => {
        console.info('viene chiamata la funzione reset');
        this.echartsOptions = this._createOpt();
      })
    }
  }

  selectGraphic(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    if (!this.grafico?.active) {
      // Chiamo lo store per cambiare il grafico attivo
      console.info('chiamo lo store e cambio il grafico attivo');
      this.storeService.dispatch(attivoGraficoElaborazioneAction(this.index));
    }

  }

  deleteElement() {

    this.storeService.select(listaGraficiElaborazioniSelector).pipe(
      take(1),
    ).subscribe(lista => {
      let elementIndex = lista.findIndex(item => item.indexTime === this.grafico.indexTime);
      this.storeService.dispatch(removeGraficoElaborazioniAction(elementIndex));
      this.closed.emit(elementIndex);
    })
  }

  activeGrafico() {

    this.storeService.select(listaGraficiElaborazioniSelector)
      .pipe(take(1))
      .subscribe(lista => {
        let selectedGrafico = lista.find(item => item.indexTime === this.grafico.indexTime);
        if (!selectedGrafico?.active) {
          this.storeService.dispatch(activateGraficoElaborazioneAction(this.grafico.indexTime));
        }
      })
  }

  updateMaterial(value: number) {
    console.info(value);
    console.info({...this.grafico});
    this.spinnerService.show('global')
    // Chiamo lo store e cambio il valore del flag per il grafico specificato
    this.storeService.dispatch(changeValoreFlagVerificationLevel({indice: this.grafico.indexTime, valore: value}));

  }
}
