/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { TestBed } from '@angular/core/testing';

import { ThemeLayoutService } from './theme-layout.service';

describe('ThemeLayoutService', () => {
  let service: ThemeLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeLayoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
