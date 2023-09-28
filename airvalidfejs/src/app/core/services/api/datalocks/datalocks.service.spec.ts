/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { TestBed } from '@angular/core/testing';

import { DatalocksService } from './datalocks.service';

describe('DatalocksService', () => {
  let service: DatalocksService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatalocksService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
