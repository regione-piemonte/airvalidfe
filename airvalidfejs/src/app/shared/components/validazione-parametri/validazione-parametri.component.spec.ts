/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidazioneParametriComponent } from './validazione-parametri.component';

describe('ValidazioneParametriComponent', () => {
  let component: ValidazioneParametriComponent;
  let fixture: ComponentFixture<ValidazioneParametriComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ValidazioneParametriComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidazioneParametriComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
