/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { AfterViewInit , Component , Inject , OnInit , ViewChild } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NetworksService } from 'src/app/core/services/api/networks/networks.service';
import { ParametersService } from 'src/app/core/services/api/parameters/parameters.service';
import { StationsService } from 'src/app/core/services/api/stations/stations.service';
import { filter , finalize , forkJoin , map , Observable , pairwise , switchMap } from 'rxjs';
import {
  groupBy,
  mergeAll,
  mergeMap,
  reduce,
  startWith,
  tap,
  toArray,
} from 'rxjs/operators';
import { BooleanInput } from '@angular/cdk/coercion';
import { SettingsService } from 'src/app/core/services/api/settings/settings.service';
import { SensorsService } from 'src/app/core/services/api/sensors/sensors.service';
import { IDettaglioConfigParam , StationName } from '../../../../core/models/response/dettaglio-config-param';
import { IData } from '../../../../views/validazione/validazione.component';
import { DataService } from '../../../../core/services/data/data.service';

@Component({
  selector: 'app-dialog-parameters',
  templateUrl: './dialog-parameters.component.html',
  styleUrls: ['./dialog-parameters.component.scss'],
})
export class DialogParametersComponent implements OnInit, AfterViewInit {
  result=''
  form!: FormGroup;
  formPreset!: FormGroup;
  formConfPreset!: FormGroup;
  description: string;
  listaAreeTerritoriali$ = this.networkService.getNetworksName();
  listStazioni$: Observable<any[]> = new Observable();
  listParametri$: Observable<any[]> = new Observable();
  listParametriCompleta: Array<any> = [];
  presetCheck: BooleanInput = false;
  savePresetExpansion: Boolean = false;
  selectPreset: Array<any> = [
    {
      name: 'Preset 1',
      retiTerritoriali: [
        "RETE QUALITA' ARIA PROV. ASTI",
        "RETE QUALITA' ARIA PROV. CUNEO",
        "RETE QUALITA' ARIA PROV. TORINO",
      ],
      stazioniTerritoriali: [
        'Asti - Baussano',
        'Torino - Collegno',
        'Cuneo - Alpini',
      ],
      parametriTerritoriali: ['Biossido di azoto (NO2)'],
    },
    {
      name: 'Preset 2',
      retiTerritoriali: ["RETE QUALITA' ARIA PROV. ASTI"],
      stazioniTerritoriali: ['Asti - Baussano'],
      parametriTerritoriali: ['Biossido di azoto (NO2)'],
    },
  ];

  constructor(
    private fb: FormBuilder,
    private networkService: NetworksService,
    private parametersService: ParametersService,
    private stationsService: StationsService,
    private dialogRef: MatDialogRef<DialogParametersComponent>,
    private settingService: SettingsService,
    private sensorService: SensorsService,
    private readonly dataService: DataService ,
    @Inject(MAT_DIALOG_DATA) data: any
  ) {
    this.description = data.description;
  }
  response: Array<any> = [];
  listSensori?: IDettaglioConfigParam[];

  ngOnInit() {
    this.form = this.fb.group({
      areeTerritoriali: ['', [Validators.required]],
      stazioni: ['', [Validators.required]],
      parametri: ['', [Validators.required]],
    });
    this.formPreset = this.fb.group({
      presetParams: ['', [Validators.required]],
    });
    this.formConfPreset = this.fb.group({
      nameConfPreset: ['', [Validators.required]],
    });

    this.onChanges();
  }

  ngAfterViewInit() {
    this.formPreset.get('presetParams')?.valueChanges
      .pipe(
        filter((value) => !!value),
        switchMap((value) => {
          this.form.reset();
          return this.settingService.getDetPreference(value).pipe(
            mergeMap(({listSensorId}) => forkJoin([...listSensorId.map((id) => this.sensorService.getSensorDetail(id))]))
          )
        }))
      .subscribe((value) => {
        console.log( value );

        this.listSensori = value;
        let {networkNames,sensorNamesList,sensorNames,stationNames} = this.dataService.createData( value );
        this.form.setValue({
          areeTerritoriali: networkNames,
          stazioni: stationNames,
          parametri: sensorNamesList,
        })
        this.listParametriCompleta = sensorNames;
        // this.form.get('areeTerritoriali')?.setValue(this.listSensori?.map((el) => el.networkName));
        // this.form.get('stazioni')?.setValue(this.listSensori?.map((el) => el.stationName));
        // const map1 = this.listSensori?.map(( el) => el.sensorName);
        // let newMap = new Map(map1?.map((el) => [el['name'], el])).values();
        // let newList = Array.from(newMap);
        // this.form.get('parametri')?.setValue(newList);
        // this.listParametriCompleta = this.listSensori?.map((el) => el.sensorName);
      });
  }

  onChanges(): void {
    if (this.form) {
      this.form
        .get('areeTerritoriali')!
        .valueChanges.pipe(startWith([]), pairwise<StationName[]>())
        .pipe(
          filter(([prev, next]) => !!next && next?.length > 0),
        )
        .subscribe(([prev, next]: [any, any]) => {
          const arrayStation: Array<any> = [];
          next.forEach((element: any) => {
            arrayStation.push(
              this.networkService.getStationsNameByNetwork(element.key)
            );
          });

          this.listStazioni$ = forkJoin(arrayStation).pipe(
            map((data) =>
              data.reduce((result, arr) => [...result, ...arr], [])
            ),
            map((el) => el.sort((a: any, b: any) => (a.name < b.name ? -1 : 1)))
          );
        });

      this.form
        .get('stazioni')!
        .valueChanges.pipe(startWith([]), pairwise<StationName[]>())
        .pipe(
          filter(([prev, next]) => !!next && next?.length > 0),
        )
        .subscribe(([prev, next]: [any, any]) => {
          const arrayStation: Array<any> = [];
          next.forEach((element: any) => {
            arrayStation.push(
              this.stationsService.getSensorsNameByStation(element.key)
            );
          });

          this.listParametri$ = forkJoin(arrayStation).pipe(
            map((data) =>
              data.reduce((result, arr) => [...result, ...arr], [])
            ),
            map((el) =>
              el.sort((a: any, b: any) => (a.name < b.name ? -1 : 1))
            ),
            tap((el) => {
              this.listParametriCompleta = [...el];
            }),
            mergeAll(),
            groupBy((o: any) => o.name),
            mergeMap((grp$) =>
              grp$.pipe(
                reduce((acc, crt) => (crt.tsUpdate > acc.tsUpdate ? crt : acc))
              )
            ),
            toArray()
          );
        });
    }
  }

  save() {
    let result: IData = {
      selected: this.form.value,
      all: this.listParametriCompleta,
    };
    console.log('rewsult', result);
    this.dialogRef.close(result);
  }

  close() {
    this.dialogRef.close();
  }

  closedSelect(event: any) {}

  changePreset() {
    this.result=''
    if (this.presetCheck) {
      this.settingService.getConfigList().subscribe((res) => {
        this.selectPreset = res;
        // this.networkService.getNetworksName().subscribe();
        // this.sensorService.getSensorDetail('50.005005.802.21').subscribe();
      });
      this.formPreset.reset();
    } else {
      this.formConfPreset.reset();
      this.form.reset();
    }
  }

  unlockBtn() {
    if (!this.presetCheck) {
      if (!this.form.valid) {
        return true;
      } else {
        return this.savePresetExpansion && !this.formConfPreset.valid;
      }
    } else {
      return this.form.valid;

    }
  }

  saveConfig() {
    console.log('in attesa');

    let result = {
      selected: this.form.value,
      all: this.listParametriCompleta,
    };

    // @ts-ignore
    let map1:Array<string> = result.selected.parametri.map( par => par.name);
    // let listSensorId = result.all.filter( (par: any) => map1.filter( (par2) => par2 === par.name)).map( (par: any) => par.key);
    // @ts-ignore
    let listSensorId: Array<string> = [];
    result.selected.parametri.forEach((el: any) => {
      listSensorId.push(...result.all.filter((par: any) => par.name === el.name).map((par: any) => par.key));
    });

    console.log('result', result);

    const nameConfPreset = this.formConfPreset.get('nameConfPreset')?.value;

    let body = {
      //"prova":"prova",
      listSensorId, //["11.01234.801.21","11.01235.802.05"],
      timeUnit: 'TIMESTAMP',
      beginTime: +localStorage.getItem('startDate')!, //1682892000000,
      endTime: +localStorage.getItem('endDate')!, //1683237600000,
      activityType: 'validation',
      activityOptions: '',
    };

    this.settingService
      .setConfigSensorsList(body, nameConfPreset)
      .subscribe((res: any) => {
        this.result="Salvataggio avvenuto con successo"
        this.formConfPreset.get('nameConfPreset')?.setValue('')
      },
      (err)=>{
        this.result="Errore nel salvataggio"
      });
  }
}
