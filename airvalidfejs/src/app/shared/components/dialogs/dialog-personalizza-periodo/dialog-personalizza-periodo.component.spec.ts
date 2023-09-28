import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPersonalizzaPeriodoComponent } from './dialog-personalizza-periodo.component';

describe('DialogPersonalizzaPeriodoComponent', () => {
  let component: DialogPersonalizzaPeriodoComponent;
  let fixture: ComponentFixture<DialogPersonalizzaPeriodoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogPersonalizzaPeriodoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogPersonalizzaPeriodoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
