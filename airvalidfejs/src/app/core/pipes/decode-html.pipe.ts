import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'decodeHtml'
})
export class DecodeHtmlPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return value;

    const txt = document.createElement('textarea');
    txt.innerHTML = value;
    return txt.value;
  }
}