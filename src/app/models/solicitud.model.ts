export enum EstadoSolicitud{
    Borrador = 1,
    Enviada = 2,
    EnRevision = 3,
    Aprobada = 4,
    Rechazada = 5,
    Pagada = 6
}

export interface SolicitudDetalle {
    id: number;
    concepto: string;
    cantidad: number;
    precioUnitario: number;
    importe: number;
}

export interface Solicitud{
    id: number;
    codigo:string;
    motivo:string;
    montoTotal: number;
    estado: EstadoSolicitud;
    estadoNombre: string;
    solicitanteId: number;
    solicitanteNombre: string;
    centroCostoId?: number;
    centroCostoNombre?:string;
    fechaCreacion: string;
    detalles: SolicitudDetalle[];
}


export interface CrearSolicitudDto{
    motivo:string;
    centroCostoId:number;
    solicitanteId: number;
    detalles: CrearSolicitudDetalleDto[];
}

export interface CrearSolicitudDetalleDto{
    concepto: string;
    cantidad:number;
    precioUnitario:number;
}

export type SolicitudDetalleForm = CrearSolicitudDetalleDto;

export interface PagedResult<T>{
    items: T[];
    totalItems: number;
    paginaActual: number;
    tamanoPagina: number;
    totalPaginas: number;
}