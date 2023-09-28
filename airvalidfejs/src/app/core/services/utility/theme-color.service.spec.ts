/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { TestBed } from '@angular/core/testing';

import { ThemeColorService } from './theme-color.service';

describe('ThemeColorService', () => {
  let service: ThemeColorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeColorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
