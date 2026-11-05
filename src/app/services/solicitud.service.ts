import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, tap, catchError, of } from "rxjs";
import { Solicitud, EstadoSolicitud, SolicitudDetalleForm, CrearSolicitudDto, TimelineItem } from '../models/solicitud.model';
import { environment } from "../../environments/environment";
import { PagedResult } from "../models/solicitud.model";
import { ReturnStatement } from "@angular/compiler";

@Injectable({
    providedIn: 'root'
})
export class SolicitudService{
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/Solicitudes`;
    readonly solicitudes = signal<Solicitud[]>([]);
    private timelineMap = new Map<number, TimelineItem[]>([]);

     obtenerPaginado(pagina: number = 1, tamano: number = 50, estado?: EstadoSolicitud): Observable<PagedResult<Solicitud>> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanoPagina', tamano.toString());

    if (estado !== undefined && estado !== null) {
      params = params.set('estado', estado.toString());
    }

    return this.http.get<PagedResult<Solicitud>>(this.baseUrl, { params }).pipe(
      tap(res => {
        if (res && res.items) {
          this.solicitudes.set(res.items);
        }
      }),
      catchError(() => {
        const localItems = this.solicitudes();
        return of({
          items: localItems,
          totalItems: localItems.length,
          paginaActual: pagina,
          tamanoPagina: tamano,
          totalPaginas: 1
        });
      })
    );
  }

  obtenerPorId(id: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => {
        const local = this.solicitudes().find(s => s.id === id);
        if (local) return of(local);
        throw new Error('Solicitud no encontrada');
      })
    );
  }

  crear(dto: CrearSolicitudDto): Observable<Solicitud> {
    return this.http.post<Solicitud>(this.baseUrl, dto).pipe(
      tap(nueva => {
        this.solicitudes.update(list => [nueva, ...list]);
      }),
      catchError(() => {
        const centrosCostoMap: Record<number, string> = {
          1: 'Tecnologías de la Información',
          2: 'Operaciones y Logística',
          3: 'Ventas y Marketing',
          4: 'Finanzas y Contabilidad'
        };

        const nueva: Solicitud = {
          id: this.solicitudes().length + 1,
          codigo: `SOL-${String(this.solicitudes().length + 1).padStart(5, '0')}`,
          motivo: dto.motivo,
          montoTotal: dto.detalles.reduce((acc, d) => acc + (d.cantidad * d.precioUnitario), 0),
          estado: EstadoSolicitud.Borrador,
          estadoNombre: 'Borrador',
          solicitanteId: dto.solicitanteId || 1,
          solicitanteNombre: 'Juan Pérez',
          centroCostoId: dto.centroCostoId,
          centroCostoNombre: centrosCostoMap[dto.centroCostoId] || 'General',
          fechaCreacion: new Date().toISOString(),
          detalles: dto.detalles.map((d, idx) => ({
            id: idx + 1,
            concepto: d.concepto,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            importe: d.cantidad * d.precioUnitario
          }))
        };
        this.solicitudes.update(list => [nueva, ...list]);
        this.registrarEventoLocal(nueva.id, EstadoSolicitud.Borrador, 'Borrador', 1, 'Juan Pérez (Solicitante)', 'Creación inicial de solicitud.');
        return of(nueva);
      })
    );
  }

  actualizar(id: number, dto: CrearSolicitudDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(() => {
        this.solicitudes.update(list =>
          list.map(s => s.id === id ? { ...s, motivo: dto.motivo, centroCostoId: dto.centroCostoId } : s)
        );
      }),
      catchError(() => {
        this.solicitudes.update(list =>
          list.map(s => s.id === id ? { ...s, motivo: dto.motivo, centroCostoId: dto.centroCostoId } : s)
        );
        return of(void 0);
      })
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.solicitudes.update(list => list.filter(s => s.id !== id));
      }),
      catchError(() => {
        this.solicitudes.update(list => list.filter(s => s.id !== id));
        return of(void 0);
      })
    );
  }

  // --- TRANSICIONES DE FLUJO DE APROBACIÓN ---
  enviar(id: number): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.baseUrl}/${id}/enviar`, {}).pipe(
      tap(act => this.actualizarEnLista(act)),
      catchError(() => {
        const act = this.actualizarEstadoLocal(id, EstadoSolicitud.Enviada, 'Enviada');
        this.registrarEventoLocal(id, EstadoSolicitud.Enviada, 'Enviada', 1, 'Juan Pérez (Solicitante)', 'Solicitud enviada a revisión técnica.');
        return of(act);
      })
    );
  }

  iniciarRevision(id: number, revisorId: number = 2): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.baseUrl}/${id}/revisar?revisorId=${revisorId}`, {}).pipe(
      tap(act => this.actualizarEnLista(act)),
      catchError(() => {
        const act = this.actualizarEstadoLocal(id, EstadoSolicitud.EnRevision, 'EnRevision');
        this.registrarEventoLocal(id, EstadoSolicitud.EnRevision, 'EnRevision', revisorId, 'María Gómez (Revisora)', 'Revisión técnica iniciada.');
        return of(act);
      })
    );
  }

  aprobar(id: number, comentario: string, aprobadorId: number = 3): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.baseUrl}/${id}/aprobar`, { comentario, aprobadorId }).pipe(
      tap(act => this.actualizarEnLista(act)),
      catchError(() => {
        const act = this.actualizarEstadoLocal(id, EstadoSolicitud.Aprobada, 'Aprobada');
        this.registrarEventoLocal(id, EstadoSolicitud.Aprobada, 'Aprobada', aprobadorId, 'Carlos Soto (Gerente)', comentario || 'Aprobado conforme.');
        return of(act);
      })
    );
  }

  rechazar(id: number, motivo: string, responsableId: number = 3): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.baseUrl}/${id}/rechazar`, { motivo, responsableId }).pipe(
      tap(act => this.actualizarEnLista(act)),
      catchError(() => {
        const act = this.actualizarEstadoLocal(id, EstadoSolicitud.Rechazada, 'Rechazada');
        this.registrarEventoLocal(id, EstadoSolicitud.Rechazada, 'Rechazada', responsableId, 'Carlos Soto (Gerente)', motivo);
        return of(act);
      })
    );
  }

  pagar(id: number, medioPago: string, numeroOperacion: string, responsableId: number = 4): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.baseUrl}/${id}/pagar`, { medioPago, numeroOperacion, responsableId }).pipe(
      tap(act => this.actualizarEnLista(act)),
      catchError(() => {
        const act = this.actualizarEstadoLocal(id, EstadoSolicitud.Pagada, 'Pagada');
        const detallePago = `Pago procesado vía ${medioPago}. Operación N° ${numeroOperacion}`;
        this.registrarEventoLocal(id, EstadoSolicitud.Pagada, 'Pagada', responsableId, 'Ana Ruiz (Tesorería)', detallePago);
        return of(act);
      })
    );
  }

  obtenerTimeline(id: number): Observable<TimelineItem[]> {
    return this.http.get<TimelineItem[]>(`${this.baseUrl}/${id}/timeline`).pipe(
      catchError(() => {
        const lista = this.timelineMap.get(id) || [];
        return of([...lista]);
      })
    );
  }

  private actualizarEnLista(actualizada: Solicitud): void {
    this.solicitudes.update(list => list.map(s => s.id === actualizada.id ? actualizada : s));
  }

  private actualizarEstadoLocal(id: number, estado: EstadoSolicitud, estadoNombre: string): Solicitud {
    let result!: Solicitud;
    this.solicitudes.update(list =>
      list.map(s => {
        if (s.id === id) {
          result = { ...s, estado, estadoNombre };
          return result;
        }
        return s;
      })
    );
    return result;
  }

  private registrarEventoLocal(
    solicitudId: number,
    estadoResultante: EstadoSolicitud,
    estadoNombre: string,
    responsableId: number,
    responsableNombre: string,
    comentario?: string
  ): void {
    const list = this.timelineMap.get(solicitudId) || [];
    const nuevoEvento: TimelineItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      solicitudId,
      estadoResultante,
      estadoNombre,
      responsableId,
      responsableNombre,
      comentario,
      fechaAccion: new Date().toISOString()
    };
    this.timelineMap.set(solicitudId, [...list, nuevoEvento]);
  }
}