import {ChangeDetectorRef, Component, EventEmitter, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {IResponseReportElaborazione} from "@services/core/api/reportistica/models/getResponseItem.model";
import {EChartsOption, EChartsType, SeriesOption} from "echarts";
import {LineChart} from "echarts/charts";
import {DataZoomComponent, GridComponent, LegendComponent, TitleComponent, ToolboxComponent, TooltipComponent} from "echarts/components";
import {NgxSpinnerService} from "ngx-spinner";
import {ThemeLayoutService} from "@services/core/utility/theme-layout.service";
import {filter, map, Observable, take} from "rxjs";
import {Layout} from "@models/user-settinng.interface";
import {ColorService} from "@services/core/utility/color.service";
import {IOutputData} from 'angular-split';
import {ExpandAreaService} from '@services/core/utility/expand-area.service'
import {Store} from '@ngrx/store'
import {idReportAndTime, idReportSpecialisticoElaborazione} from 'src/app/state/selectors/elaborazione-specialistica.selectors'
import {AppState} from 'src/app/state'
import {ISpecialisticoState} from '@reducers/*'
import {DateSettingService, tipoDateEnum} from "@services/core/utility/date-setting.service";
import {formatDate} from "@angular/common";

type LayoutType = 'default' | 'reverse' | 'col';

type SideType = 'left' | 'right' | 'up' | 'down';

@Component({
  selector: 'app-specialistico-report',
  templateUrl: './specialistico-report.component.html',
  styleUrls: ['./specialistico-report.component.scss']
})
export class SpecialisticoReportComponent implements OnInit {

  private echartinstance!: EChartsType;
  echartsExtentions: any[];
  echartsOptions!: EChartsOption;

  grafici!: IResponseReportElaborazione;
  lunghezza: number = 70;
  layuot$: Observable<Layout> = this.layoutService.validazioneLayout$.pipe(
    filter(layout => !!layout),
    map((layout) => layout!)
  );




  color = this.colorService.generateNewColor();

  optionsEvent = new EventEmitter<EChartsOption>();
  displayedColumns: Iterable<string> = ['parametro', 'action'];
  clickedRows = new Set<SeriesOption>();
  validazioneLayout$?: Layout | null;
  validazioneLayoutBody$: any;
  $graficoDate = this._storeService.select(idReportAndTime);
  private idSpecialistico: string  = '';

  constructor(
    private readonly activate: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private readonly layoutService: ThemeLayoutService,
    private readonly colorService: ColorService,
    private readonly cdref: ChangeDetectorRef,
    private readonly _expandAreaService:ExpandAreaService,
    private readonly _storeService: Store<AppState>,
    private readonly dateSettingService: DateSettingService,
  ) {
    this.grafici = this.activate.snapshot.data['grafici'];
    this.echartsExtentions = [
      LineChart,
      GridComponent,
      LegendComponent,
      TooltipComponent,
      TitleComponent,
      ToolboxComponent,
      DataZoomComponent
    ];
    this._storeService.select(idReportSpecialisticoElaborazione).pipe(
      filter(id => !!id),
      take(1),
    ).subscribe({
      next: id => {
        console.info(id);
        this.idSpecialistico = id!;
        this.echartsOptions = this._createOpt(id?.includes('no2_nox'));
      },
      error: err => {
        console.error(err);
      }
    })

    this.getLayoutConf();
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
      // if (this.validazioneLayout$ && this.validazioneLayout$.default && this.validazioneLayout$!.set !== 'col' ) {
      //   this.validazioneLayout$.default.slide_a = size;
      // }
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
      // if (this.validazioneLayout$ && this.validazioneLayout$.default && this.validazioneLayout$!.set !== 'col') {
      //   this.validazioneLayout$.default.slide_b = size;
      // }
      this.cdref.markForCheck();
    });
  }

  private _createOpt(no2_nox: boolean = false): EChartsOption {
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
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        axisPointer: {
          type: 'cross'
        },
        position: function (pos, params, el, elRect, size) {
         let obj = {top: 10};
          // @ts-ignore
          obj[
            ['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]
          ] = 30;
          return obj;
        },
        extraCssText: 'width: 350px'
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
      dataZoom: {
        labelFormatter: function (value: number, valueStr: string) {

          let [data, oraString] = valueStr.split(' ');
          if (data) {
            let [year, mount, day] = data.split('-');
            data = `${mount}-${day}`
          }
          let formattedDate = data.split('-').reverse().join('-');
          // Nel case che ci sia l'ora formatto in un modo altrimenti non faccio nulla;
          if (oraString) {
            let [ora,min,sec] = oraString.split(':');
            return `${formattedDate}\n${ora}:${min}`;
          }
          return formattedDate

        }
      },
      grid:{
        left: '5%',
        right: '5%',
      },
      series: this.createGrafico(this.grafici) as SeriesOption,
      useUTC: true
    };
  }

  ngOnInit(): void {

    console.info(this.grafici, 'Specialistico Report Component');

    console.info(this.color, 'Specialistico Report Component primo colore generato');
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


  private _getPrimoAndSecondoValore(evento: IOutputData) {
    let {sizes} = evento;
    let [primo, secondo, terzo] = sizes;
    return {
      primo: +primo,
      secondo: +secondo,
      terzo: +terzo
    }
  }

  createGrafico(grafici: IResponseReportElaborazione) {
    let {dataSeries, reportID,reportDescription,reportName,timeBase} = grafici;
    const result = dataSeries.map(({name, values: value, id}, i) => {
      let [primo, secondo, terzo] = name.split('-');
      let colorStyle = i === 0 ? this.color : this.colorService.generateNewColorFromBase(i);
      if (terzo) {
        let [nome, par] = terzo.trim().split('(');
        secondo = `${secondo} (${par}`
      }
      return {
        idSerie: id,
        name: `${primo}-${secondo}`,
        nameList: name,
        showSymbol: value && value.length < 100,
        symbol: 'circle',
        symbolSize: 8,
        type: 'line',
        itemStyle: {
          color: colorStyle,
        },
        lineStyle: {
          width: 1.5,
          color: colorStyle,
        },
        emphasis: {
          focus: 'series'
        },
        timebase: timeBase,
        data: value.map(({timestamp, value}) => ({name: formatDate(timestamp, 'dd/MM','IT'),value:[timestamp, value]}) )
      };
    });
    this.spinner.hide('global');
    return result;
  }

  dataInizioGrafico(data: ISpecialisticoState) {
    return data.anni ? data.anni.firstYearValueString : this.dateSettingService.formatData(data.date?.begin!, tipoDateEnum.ddMMYyyy);
  }

  dataFineGrafico(data: ISpecialisticoState) {
    return data.anni ? data.anni.secondYearValueString : this.dateSettingService.formatData(data.date?.end!, tipoDateEnum.ddMMYyyy);
  }


  chartInit(event: any) {
    // console.info(event, `Init per il grafico ${this.index}`);
    if (!this.echartinstance) {


      this.echartinstance = event;

      this.optionsEvent.emit(this.echartsOptions);


      this.echartinstance?.on('restore', (event) => {
        console.info('viene chiamata la funzione reset');
        this.echartsOptions = this._createOpt(!!this.idSpecialistico);
      })
    }
  }

  getSerie(): SeriesOption[]{
    return this.echartsOptions.series as SeriesOption[];
  }


  actionClick(serie: SeriesOption, i: number, evento: MouseEvent) {
    console.info(serie, 'Serie click Report');
    console.info(i, 'Indice click Serie');
    evento.preventDefault();
    evento.stopPropagation();
    if (this.clickedRows.has(serie)) {
      this.clickedRows.delete(serie);
    } else {
      this.clickedRows.add(serie);
    }
    // Uso la funzione nativa per spegnere la serie
    this.echartinstance.dispatchAction({
      type: 'legendToggleSelect',
      name: serie.name
    });
  }
}
