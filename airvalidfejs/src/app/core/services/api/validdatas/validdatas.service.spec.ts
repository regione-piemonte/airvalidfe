/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { TestBed } from '@angular/core/testing';

import { ValiddatasService } from './validdatas.service';

describe('ValiddatasService', () => {
  let service: ValiddatasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValiddatasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
