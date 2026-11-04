import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, tap, catchError, of } from "rxjs";
import { Solicitud, EstadoSolicitud, SolicitudDetalleForm, CrearSolicitudDto } from "../models/solicitud.model";
import { environment } from "../../environments/environment";
import { PagedResult } from "../models/solicitud.model";
import { ReturnStatement } from "@angular/compiler";

@Injectable({
    providedIn: 'root'
})
export class SolicitudService{
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/solicitudes`;
    readonly solicitudes = signal<Solicitud[]>([]);

    obtenerPaginado(pagina: number =1, tamano: number=50, estado?:EstadoSolicitud):Observable<PagedResult<Solicitud>>{
        let params = new HttpParams()
          .set('pagina', pagina.toString())
          .set('tamanoPagina', tamano.toString());

        if(estado !== undefined && estado !== null){
          params = params.set('estado', estado.toString());
        }

        return this.http.get<PagedResult<Solicitud>>(this.baseUrl, {params}).pipe(
          tap(res => {
            if(res && res.items){
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


    crear(dto:CrearSolicitudDto):Observable<Solicitud>{
      return this.http.post<Solicitud>(this.baseUrl, dto).pipe(
        tap(nueva =>{
          this.solicitudes.update(list => [nueva, ...list]);
        }),
        catchError(() => {
          const centrosCostoMap:Record<number, string> ={
            1: 'Tecnologías de la Información',
            2: 'Operaciones y Logística',
            3: 'Ventas y Marketing',
            4: 'Finanzas y Contabilidad'
          };

          const nueva:Solicitud = {
            id: this.solicitudes().length + 1,
            codigo: `SOL-${String(this.solicitudes().length + 1).padStart(5, '0')}`,
            motivo: dto.motivo,
            montoTotal: dto.detalles.reduce((acc, d) => acc + (d.cantidad * d.precioUnitario), 0),
            estado: EstadoSolicitud.Borrador,
            estadoNombre: 'Borrador',
            //solicitanteId: dto.solicitanteId || 3,
            solicitanteId: 3,
            solicitanteNombre: 'Juan Perez',
            centroCostoId: dto.centroCostoId,
            centroCostoNombre: centrosCostoMap[dto.centroCostoId] || 'General',
            fechaCreacion: new Date().toISOString(),
            detalles: dto.detalles.map((d, idx) => ({
              id:idx + 1,
              concepto: d.concepto,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              importe: d.cantidad * d.precioUnitario
            }))
          };

          this.solicitudes.update(list => [nueva, ...list]);
          return of(nueva);
        })
      );
    }

    eliminar(id:number):Observable<void>{
      return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
        tap(() => {
          this.solicitudes.update(list => list.filter(s => s.id !== id));
        }),
        catchError(()=>{
          return of(void 0);
        })
      );      
    }
}