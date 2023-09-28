/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { TestBed } from '@angular/core/testing';

import { PollingLockService } from './polling-lock.service';

describe('PollingLockService', () => {
  let service: PollingLockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PollingLockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
