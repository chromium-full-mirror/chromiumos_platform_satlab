import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'safeNumber',
})
export class SafeNumberPipe implements PipeTransform {
  transform(value: number) {
    return Number.isNaN(value) ? '' : Number(value);
  }
}
