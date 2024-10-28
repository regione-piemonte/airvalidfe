import {deleteParametriElaborazioneAction, deleteParametriSelezionatiAction} from '@actions/*';
import {Component, EventEmitter, OnInit, Output, ViewChild,} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {IParameter} from '@models/dataService';
import {Store} from '@ngrx/store';
import {dialogLavoroSelector, parametriElaborazioneSelector, parametriSelector} from '@selectors/*';
import {combineLatest, filter, iif, map, of, switchMap, take} from 'rxjs';
import {AppState} from 'src/app/state';
import {MatTable} from '@angular/material/table';
import {UtilityService} from "@services/core/utility/utility.service";

export interface IVisibility {
  name: string;
  visibilityNotValid: number;
}

@Component({
  selector: 'app-dialog-remove-parameter',
  templateUrl: './dialog-remove-parameter.component.html',
  styleUrls: ['./dialog-remove-parameter.component.scss'],
})
export class DialogRemoveParameterComponent implements OnInit {
  @Output() visibilityNotValidDataSeries = new EventEmitter<IVisibility | null>();
  @Output() deleteSeries = new EventEmitter();
  @Output() rowSelected = new EventEmitter<number | Array<number>>();
  @ViewChild('table') table: MatTable<IParameter> | undefined;
  form = this._createForm();
  // unione dei parametri di validazione e elebaorazione presenti nello store e del tipo di lavoro
  combinedParams$ = combineLatest([
    this.storeService.select(dialogLavoroSelector),
    this.storeService.select(parametriSelector),
    this.storeService.select(parametriElaborazioneSelector)
  ]).pipe(
    map(([tipoLavoro, paramsValidazione, paramsElaborazione]) => ({
      tipoLavoro,
      paramsValidazione,
      paramsElaborazione
    })),
  );

  tipoLavoro$ = this.storeService.select(dialogLavoroSelector);

  parameters: Array<IParameter> = [];

  constructor(
    private dialogRef: MatDialogRef<DialogRemoveParameterComponent>,
    private readonly storeService: Store<AppState>,
    private fb: FormBuilder,
    private readonly utilityService: UtilityService,
  ) {
  }

  ngOnInit(): void {
  }

  /**
   * Create a new form group with three form controls: areeTerritoriali, stazioni, and parametri.
   *
   * @private
   * @returns {FormGroup} - The created form group.
   * @example
   * this._createForm();
   * output: {
   *   parametri: '',
   * }
   */
  private _createForm(): FormGroup {
    return this.fb.group({
      parametri: ['', [Validators.required]],
    });
  }

  removeParameters() {
    this.tipoLavoro$
      .pipe(
        take(1),
        map(tipoLavoro => ({tipoLavoro, parametri: this.getParametriSelezionati()})),
        switchMap(({tipoLavoro, parametri}) => {
          this.dialogRef.close();
          return this.utilityService.checkIfParametroSelezionato(parametri).pipe(
            map(hasItem => ({tipoLavoro, parametri, hasItem})),
          )
        }),
        switchMap(({hasItem, parametri, tipoLavoro}) =>
          iif(() => hasItem,
            this.utilityService.checkDelete().pipe(
              map(resp => ({tipoLavoro, parametri, hasItem, hasDelete: resp})),
            ),
            of({parametri, tipoLavoro, hasItem, hasDelete: true})
          )
        ),
        filter(({hasDelete}) => hasDelete),
      )
      .subscribe( ({tipoLavoro, parametri: selectedParametri, hasItem}) => {

        if (tipoLavoro === 'validazione') {
          this.storeService.dispatch(deleteParametriSelezionatiAction(selectedParametri));
        } else if (tipoLavoro === 'elaborazione') {
          // cancellazione parametri per elaborazione
          this.storeService.dispatch(deleteParametriElaborazioneAction(selectedParametri));
        } else {
          this.storeService.dispatch(deleteParametriSelezionatiAction(selectedParametri));
        }
        // this.dialogRef.close();
      })

  }


  /**
   * Questo metodo restituisce i parametri selezionati nel modulo reattivo.
   * I parametri sono ottenuti dal controllo del modulo denominato 'parametri'.
   *
   * @private
   * @returns {Array<IParameter>} - Un array di oggetti IParameter selezionati.
   * @example
   * const parametriSelezionati = this.getParametriSelezionati();
   * console.log(parametriSelezionati);
   */
  private getParametriSelezionati(): Array<IParameter> {
    return this.form.get('parametri')!.value;
  }

  close() {
    this.dialogRef.close();
  }
}
