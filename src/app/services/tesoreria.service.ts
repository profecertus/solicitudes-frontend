import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MovimientoTesoreriaDto } from '../models/solicitud.model';

@Injectable({
  providedIn: 'root'
})
export class TesoreriaService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/MovimientosTesoreria`;

  listar(): Observable<MovimientoTesoreriaDto[]> {
    return this.http.get<MovimientoTesoreriaDto[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<MovimientoTesoreriaDto> {
    return this.http.get<MovimientoTesoreriaDto>(`${this.baseUrl}/${id}`);
  }
}
