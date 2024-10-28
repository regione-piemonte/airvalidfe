import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ToggleGroup} from "@dialog/*";

@Component({
  selector: 'app-trigger-menu-elaborazione',
  templateUrl: './trigger-menu-elaborazione.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TriggerMenuElaborazioneComponent implements OnInit {

  @Input() renderTableElaborazione: Array<ToggleGroup> = [];
  @Output() valueChange: EventEmitter<ToggleGroup> = new EventEmitter<ToggleGroup>();
  selectedRender: any;


  constructor() { }

  ngOnInit(): void {
    console.info(this.renderTableElaborazione)
  }


  updateValue(value: ToggleGroup) {
    if (this.selectedRender) {
      this.selectedRender.isSelected = false;
    }
    value.isSelected = true;
    this.selectedRender = value;
    this.valueChange.emit(value);
  }

}
