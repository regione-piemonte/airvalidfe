import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {environment} from "@environments/environment";
import {ToggleGroup} from "@dialog/*";

@Component({
  selector: 'app-trigger-menu-reportistica',
  templateUrl: './trigger-menu-reportistica.component.html'
})
export class TriggerMenuReportisticaComponent implements OnInit {
  @Input() renderTableReportistica: Array<ToggleGroup> = [];
  @Input() renderTableReportisticaSpecialistica: Array<ToggleGroup> = [];
  @Input() renderTableReportisticaStandard: Array<ToggleGroup> = [];
  @Output() valueChange: EventEmitter<ToggleGroup> = new EventEmitter<ToggleGroup>();
  selectedRender?: ToggleGroup;
  isSpecialisticoSelected = false;

  environment = environment;
  isStandardSelected: boolean = false;


  constructor() { }

  ngOnInit(): void {
  }

  updateValue(value: ToggleGroup, selectedType: 'standard' | 'controlli') {
    if (this.selectedRender) {
      this.selectedRender = {
        ...this.selectedRender,
        isSelected : false
      };
    }
    if (selectedType === 'controlli') {
      this.isSpecialisticoSelected = (value !== this.renderTableReportistica[0]);
      this.isStandardSelected = false;
    }
    if (selectedType === 'standard') {
      this.isSpecialisticoSelected = false;
      this.isStandardSelected = true;
    }
    value = {
      ...value,
      isSelected: true,
    };
    this.selectedRender = value;
    this.valueChange.emit(value);
  }


}
