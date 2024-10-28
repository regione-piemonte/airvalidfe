/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { Pipe, PipeTransform } from '@angular/core';
import {DateSettingService} from "@services/core/utility/date-setting.service";

@Pipe({
  name: 'formatTime'
})
export class FormatTimePipe implements PipeTransform {

  constructor(
    private readonly dataSettingService: DateSettingService
  ) {
  }

  transform(time: number, type: string): string {
    time = time + (60 * 60 * 1000);
    return this.dataSettingService.getFormatterToTimeBase(time, type);
  }

}
