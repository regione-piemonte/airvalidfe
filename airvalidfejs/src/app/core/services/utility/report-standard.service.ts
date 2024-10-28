/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor() { }

  getUniqueLevel4ContentIds(data: any): string[] {
    const ids = new Set<string>();

    if (data.report && data.report.tables) {
      for (const table of data.report.tables) {
        if (table.level4ContentIds) {
          table.level4ContentIds.forEach((id: string) => ids.add(id));
        }
      }
    }
    
    return Array.from(ids); // Converti il set in un array
  }
}
