/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { TestBed } from '@angular/core/testing';

import { ThemeFontService } from './theme-font.service';

describe('ThemeFontService', () => {
  let service: ThemeFontService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeFontService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
