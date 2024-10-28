import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'separatoreMigliaia'
})
export class SeparatoreMigliaiaPipe implements PipeTransform {

  transform(value: string | null, ...args: unknown[]): string {
    if (value && !isNaN(Number(value))) {
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    return value ?? '';
  }

}
