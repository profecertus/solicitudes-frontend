import { Pipe, PipeTransform, inject } from '@angular/core';
import { HashService } from '../services/hash.service';

/**
 * Pipe standalone para convertir identificadores numéricos a hash en plantillas HTML.
 * Uso: [routerLink]="['/solicitudes', item.id | hashId]"
 */
@Pipe({
  name: 'hashId',
  standalone: true
})
export class HashIdPipe implements PipeTransform {
  private readonly hashService = inject(HashService);

  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return this.hashService.encode(value);
  }
}
