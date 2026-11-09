import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../../services/solicitud.service';
import { AprobacionService } from '../../services/aprobacion.service';
import { RolService } from '../../services/rol.service';
import { NotificationService } from '../../services/notification.service';
import { AprobacionDto, EstadoSolicitud, RolUsuario, Solicitud } from '../../models/solicitud.model';

@Component({
  selector: 'app-aprobaciones',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './aprobaciones.html',
  styleUrl: './aprobaciones.css'
})
export class AprobacionesComponent implements OnInit {
  readonly solicitudService = inject(SolicitudService);
  private readonly aprobacionService = inject(AprobacionService);
  readonly rolService = inject(RolService);
  private readonly notify = inject(NotificationService);

  readonly EstadoSolicitud = EstadoSolicitud;
  readonly RolUsuario = RolUsuario;

  readonly tabActiva = signal<'pendientes' | 'historial'>('pendientes');
  readonly historialAprobaciones = signal<AprobacionDto[]>([]);
  readonly filtroHistorial = signal<string>('');

  // Modales
  readonly modalDictamenAbierto = signal<boolean>(false);
  readonly dictamenTipo = signal<'aprobar' | 'rechazar'>('aprobar');
  readonly dictamenComentario = signal<string>('');
  readonly solicitudSeleccionada = signal<Solicitud | null>(null);

  // Computados
  readonly solicitudesPendientes = computed(() => {
    return this.solicitudService.solicitudes().filter(s =>
      s.estado === EstadoSolicitud.Enviada || s.estado === EstadoSolicitud.EnRevision
    );
  });

  readonly totalEnviadas = computed(() =>
    this.solicitudService.solicitudes().filter(s => s.estado === EstadoSolicitud.Enviada).length
  );

  readonly totalEnRevision = computed(() =>
    this.solicitudService.solicitudes().filter(s => s.estado === EstadoSolicitud.EnRevision).length
  );

  readonly totalAprobadas = computed(() =>
    this.solicitudService.solicitudes().filter(s => s.estado === EstadoSolicitud.Aprobada).length
  );

  readonly totalRechazadas = computed(() =>
    this.solicitudService.solicitudes().filter(s => s.estado === EstadoSolicitud.Rechazada).length
  );

  readonly historialFiltrado = computed(() => {
    const q = this.filtroHistorial().toLowerCase().trim();
    const lista = this.historialAprobaciones();
    if (!q) return lista;
    return lista.filter(item =>
      item.codigoSolicitud?.toLowerCase().includes(q) ||
      item.responsableNombre?.toLowerCase().includes(q) ||
      item.estadoNombre?.toLowerCase().includes(q) ||
      (item.comentario && item.comentario.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.solicitudService.obtenerPaginado(1, 50).subscribe();
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.aprobacionService.listar().subscribe({
      next: (data) => this.historialAprobaciones.set(data),
      error: () => this.notify.error('No se pudo cargar el historial de aprobaciones')
    });
  }

  esRol(rol: RolUsuario): boolean {
    return this.rolService.usuarioActual().rol === rol;
  }

  iniciarRevision(solicitud: Solicitud): void {
    const revId = this.rolService.usuarioActual().id;
    this.solicitudService.iniciarRevision(solicitud.id, revId).subscribe({
      next: () => {
        this.notify.info(`Revisión técnica iniciada para ${solicitud.codigo}`);
        this.cargarHistorial();
      }
    });
  }

  abrirModalDictamen(solicitud: Solicitud, tipo: 'aprobar' | 'rechazar'): void {
    this.solicitudSeleccionada.set(solicitud);
    this.dictamenTipo.set(tipo);
    this.dictamenComentario.set('');
    this.modalDictamenAbierto.set(true);
  }

  cancelarDictamen(): void {
    this.modalDictamenAbierto.set(false);
    this.solicitudSeleccionada.set(null);
  }

  confirmarDictamen(): void {
    const sol = this.solicitudSeleccionada();
    if (!sol) return;

    const tipo = this.dictamenTipo();
    const comentario = this.dictamenComentario().trim();
    const usuarioId = this.rolService.usuarioActual().id;

    if (tipo === 'rechazar' && !comentario) {
      this.notify.warning('El motivo de rechazo es obligatorio para emitir el dictamen.');
      return;
    }

    if (tipo === 'aprobar') {
      this.solicitudService.aprobar(sol.id, comentario, usuarioId).subscribe({
        next: (act) => {
          this.notify.success(`¡Solicitud ${act.codigo} aprobada exitosamente!`);
          this.modalDictamenAbierto.set(false);
          this.solicitudSeleccionada.set(null);
          this.cargarHistorial();
        }
      });
    } else {
      this.solicitudService.rechazar(sol.id, comentario, usuarioId).subscribe({
        next: (act) => {
          this.notify.error(`Solicitud ${act.codigo} ha sido rechazada.`);
          this.modalDictamenAbierto.set(false);
          this.solicitudSeleccionada.set(null);
          this.cargarHistorial();
        }
      });
    }
  }

  obtenerClaseBadge(estado: number): string {
    switch (estado) {
      case EstadoSolicitud.Borrador: return 'badge bg-secondary';
      case EstadoSolicitud.Enviada: return 'badge bg-info text-dark';
      case EstadoSolicitud.EnRevision: return 'badge bg-warning text-dark';
      case EstadoSolicitud.Aprobada: return 'badge bg-success';
      case EstadoSolicitud.Rechazada: return 'badge bg-danger';
      case EstadoSolicitud.Pagada: return 'badge bg-primary';
      default: return 'badge bg-secondary';
    }
  }
}
