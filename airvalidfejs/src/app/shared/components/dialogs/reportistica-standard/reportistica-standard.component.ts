import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { IFormToStandard } from '@components/shared/dialogs/reportistica-standard/model/standard.model';

@Component({
  selector: 'app-reportistica-standard',
  templateUrl: './reportistica-standard.component.html',
  styleUrls: ['./reportistica-standard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportisticaStandardComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() valueControlTime = '';
  @Output() formValue = new EventEmitter<IFormToStandard>();
  form: FormGroup = new FormGroup({
    controlTime: new FormControl(undefined, Validators.required),
    flag: new FormControl('true', Validators.required),
    colori_evidenziazione: new FormControl(true, Validators.required),
    nomi_reti: new FormControl(true, Validators.required),
    anagrafiche_righe: new FormControl(false, Validators.required),
    tabelle: new FormGroup({
      sintesi: new FormControl(true),
      giorno_medio: new FormControl(true),
      statistiche_giornaliere: new FormControl(true),
      statistiche_mensili: new FormControl(true),
      matrice_oraria: new FormControl(true),
      stat_giorni_settimana: new FormControl(true),
      percentili: new FormControl(true),
    }),
  });

  constructor(private readonly fb: FormBuilder) {
    this.listenChanges();
  }

  ngOnInit(): void {
    console.info('init');
  }

  ngOnChanges(changes: SimpleChanges) {
    console.info('changes', changes);
    this.form.get('controlTime')?.setValue(this.valueControlTime);
  }
  ngAfterViewInit() {}

  listenChanges() {
    this.form.valueChanges.pipe().subscribe(({ controlTime }) => {
      const tabelle = this.form.get('tabelle') as FormGroup;

      tabelle.get('sintesi')?.enable({ emitEvent: false });
      tabelle.get('giorno_medio')?.enable({ emitEvent: false });
      tabelle.get('statistiche_giornaliere')?.enable({ emitEvent: false });
      tabelle.get('statistiche_mensili')?.enable({ emitEvent: false });
      tabelle.get('matrice_oraria')?.enable({ emitEvent: false });
      tabelle.get('stat_giorni_settimana')?.enable({ emitEvent: false });
      tabelle.get('percentili')?.enable({ emitEvent: false });
      switch (controlTime) {
        case 'variable':
          if (this.form.get('anagrafiche_righe')!.value) {
            tabelle.get('giorno_medio')?.disable({ emitEvent: false });
            tabelle
              .get('statistiche_giornaliere')
              ?.disable({ emitEvent: false });
            tabelle.get('statistiche_mensili')?.disable({ emitEvent: false });
            tabelle.get('matrice_oraria')?.disable({ emitEvent: false });
            tabelle.get('stat_giorni_settimana')?.disable({ emitEvent: false });
            tabelle.get('percentili')?.disable({ emitEvent: false });
          } else {
            tabelle.get('statistiche_mensili')?.disable({ emitEvent: false });
            tabelle.get('stat_giorni_settimana')?.disable({ emitEvent: false });
            tabelle.get('percentili')?.disable({ emitEvent: false });
          }
          break;
        case 'yearly':
          if (this.form.get('anagrafiche_righe')!.value) {
            tabelle.get('giorno_medio')?.disable({ emitEvent: false });
            tabelle
              .get('statistiche_giornaliere')
              ?.disable({ emitEvent: false });
            tabelle.get('statistiche_mensili')?.disable({ emitEvent: false });
            tabelle.get('matrice_oraria')?.disable({ emitEvent: false });
            tabelle.get('stat_giorni_settimana')?.disable({ emitEvent: false });
            tabelle.get('percentili')?.disable({ emitEvent: false });
          } else {
            tabelle
              .get('statistiche_giornaliere')
              ?.disable({ emitEvent: false });
            tabelle
              .get('statistiche_giornaliere')
              ?.disable({ emitEvent: false });
            tabelle.get('matrice_oraria')?.disable({ emitEvent: false });
          }
          break;
        default:
          tabelle.get('sintesi')?.disable({ emitEvent: false });
          tabelle.get('giorno_medio')?.disable({ emitEvent: false });
          tabelle.get('statistiche_giornaliere')?.disable({ emitEvent: false });
          tabelle.get('statistiche_mensili')?.disable({ emitEvent: false });
          tabelle.get('matrice_oraria')?.disable({ emitEvent: false });
          tabelle.get('stat_giorni_settimana')?.disable({ emitEvent: false });
          tabelle.get('percentili')?.disable({ emitEvent: false });
          break;
      }
    });
  }

  ngOnDestroy() {
    // Send to form is valid
    if (this.form.valid) {
      this.formValue.emit(this.form.value);
    }
  }
}
