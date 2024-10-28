import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialisticoReportComponent } from './specialistico-report.component';

describe('SpecialisticoReportComponent', () => {
  let component: SpecialisticoReportComponent;
  let fixture: ComponentFixture<SpecialisticoReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpecialisticoReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecialisticoReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
