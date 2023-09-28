/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initialChar'
})
export class UserInitial implements PipeTransform
{
    transform(value: string): string {
        if (!value) { return ''; }
        return value.charAt(0);
      }
}