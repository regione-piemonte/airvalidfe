/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElaborazioniComponent } from './elaborazioni.component';

describe('ElaborazioniComponent', () => {
  let component: ElaborazioniComponent;
  let fixture: ComponentFixture<ElaborazioniComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ElaborazioniComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ElaborazioniComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
