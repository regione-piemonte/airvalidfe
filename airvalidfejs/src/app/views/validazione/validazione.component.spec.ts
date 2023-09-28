/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
 import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidazioneComponent } from './validazione.component';

describe('ValidazioneComponent', () => {
  let component: ValidazioneComponent;
  let fixture: ComponentFixture<ValidazioneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ValidazioneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidazioneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
