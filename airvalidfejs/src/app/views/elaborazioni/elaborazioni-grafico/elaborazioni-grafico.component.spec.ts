import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElaborazioniGraficoComponent } from './elaborazioni-grafico.component';

describe('ElaborazioniGraficoComponent', () => {
  let component: ElaborazioniGraficoComponent;
  let fixture: ComponentFixture<ElaborazioniGraficoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ElaborazioniGraficoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ElaborazioniGraficoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
