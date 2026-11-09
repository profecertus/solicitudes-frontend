import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AprobacionDto } from '../models/solicitud.model';

@Injectable({
  providedIn: 'root'
})
export class AprobacionService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Aprobaciones`;

  listar(solicitudId?: number): Observable<AprobacionDto[]> {
    let params = new HttpParams();
    if (solicitudId) {
      params = params.set('solicitudId', solicitudId.toString());
    }
    return this.http.get<AprobacionDto[]>(this.baseUrl, { params });
  }

  obtenerPorId(id: number): Observable<AprobacionDto> {
    return this.http.get<AprobacionDto>(`${this.baseUrl}/${id}`);
  }
}
