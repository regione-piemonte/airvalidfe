import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportisticaStandardComponent } from './reportistica-standard.component';

describe('ReportisticaStandardComponent', () => {
  let component: ReportisticaStandardComponent;
  let fixture: ComponentFixture<ReportisticaStandardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportisticaStandardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportisticaStandardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
