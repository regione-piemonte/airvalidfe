/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { TestBed } from '@angular/core/testing';

import { MeasureunitService } from './measureunit.service';

describe('MeasureunitService', () => {
  let service: MeasureunitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeasureunitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
