/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { TestBed } from '@angular/core/testing';

import { DatatimestampsService } from './datatimestamps.service';

describe('DatatimestampsService', () => {
  let service: DatatimestampsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatatimestampsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
