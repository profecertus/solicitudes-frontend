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

export interface TimelineItem{
    id: number;
    solicitudId: number;
    estadoResultante: EstadoSolicitud;
    estadoNombre: string;
    responsableId: number;
    responsableNombre: string;
    comentario: string | undefined;
    fechaAccion: string;
}

export enum RolUsuario{
    Usuario = 'Usuario',
    Solicitante = 'Solicitante',
    Revisor = 'Revisor',
    Aprobador = 'Aprobador',
    Tesoreria = 'Tesoreria'
}

export interface PagedResult<T>{
    items: T[];
    totalItems: number;
    paginaActual: number;
    tamanoPagina: number;
    totalPaginas: number;
}

export interface Usuario{
    id: number;
    username?: string;
    nombre: string;
    correo: string;
    activo: boolean;
    fechaCreacion: string;
    roles: RolItem[];
}

export interface RolItem{
    id: number;
    nombre: string;
    limiteAprobacion: number;
}

export interface UsuarioActivo{
    id: number;
    username?: string;
    nombre: string;
    email: string;
    rol: RolUsuario;
}

export interface LoginRequestDto {
    usuario?: string;
    username?: string;
    correo?: string;
    email?: string;
    password: string;
    ttlMinutos?: number;
    ttlSegundos?: number;
}

export interface JwtTokenDto {
    token: string;
    tokenType: string;
    ttlSeconds: number;
    ttlMinutes: number;
    fechaEmisionUtc: string;
    fechaExpiracionUtc: string;
}

export interface AuthResponseDto {
    id: number;
    username: string;
    nombre: string;
    correo: string;
    email: string;
    rol: string;
    roles: string[];
    token: string;
    tokenType: string;
    ttlSeconds: number;
    ttlMinutes: number;
    fechaEmisionUtc: string;
    expiracion: string;
}

export interface AprobacionDto {
    id: number;
    solicitudId: number;
    codigoSolicitud: string;
    estadoResultante: EstadoSolicitud;
    estadoNombre: string;
    responsableId: number;
    responsableNombre: string;
    comentario: string | null;
    fecha: string;
}

export interface MovimientoTesoreriaDto {
    id: number;
    solicitudId: number;
    codigoSolicitud: string;
    montoPagado: number;
    medio: string;
    referencia: string;
    fechaPago: string;
    creadoPor: string;
}
