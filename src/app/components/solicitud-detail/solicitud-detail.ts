import { Component, inject, signal } from '@angular/core';
import { OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../../services/solicitud.service';
import { NotificationService } from '../../services/notification.service';
import { EstadoSolicitud, RolUsuario, Solicitud, TimelineItem } from '../../models/solicitud.model';
import { RolService } from '../../services/rol.service';
import { HashService } from '../../services/hash.service';

@Component({
  selector: 'app-solicitud-detail',
  imports: [CommonModule, FormsModule, RouterLink], 
  templateUrl: './solicitud-detail.html',
  styleUrl: './solicitud-detail.css',
})
export class SolicitudDetail implements OnInit{
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private httpService = inject(SolicitudService);
  private notify = inject(NotificationService);
  private hashService = inject(HashService);
  rolService = inject(RolService);

  readonly EstadoSolicitud = EstadoSolicitud;
  readonly RolUsuario = RolUsuario;

  readonly solicitud = signal<Solicitud | undefined>(undefined);
  readonly eventosTimeline = signal<TimelineItem[]>([]);

  // Estado reactivo de Modales Inline (sin subcomponentes)
  readonly modalDictamenAbierto = signal<boolean>(false);
  readonly dictamenTipo = signal<'aprobar' | 'rechazar'>('aprobar');
  readonly dictamenComentario = signal<string>('');

  readonly modalPagoAbierto = signal<boolean>(false);
  readonly pagoMedio = signal<string>('Transferencia Bancaria');
  readonly pagoOperacion = signal<string>('');

  readonly mediosPagoDisponibles: string[] = [
    'Transferencia Bancaria',
    'Cheque de Gerencia',
    'Efectivo / Caja Chica',
    'Depósito en Cuenta'
  ];

  ngOnInit(): void {
    const rawParam = this.route.snapshot.paramMap.get('id') || '';
    const id = this.hashService.decode(rawParam);

    if (!id) {
      this.notify.error('Identificador de solicitud no válido');
      this.router.navigate(['/solicitudes']);
      return;
    }

    // Si el usuario ingresó con el ID plano (ej. /solicitudes/6),
    // ofuscar y actualizar la URL en la barra de navegación de inmediato
    if (/^\d+$/.test(rawParam)) {
      const hash = this.hashService.encode(id);
      this.location.replaceState(`/solicitudes/${hash}`);
    }

    this.cargarSolicitud(id);
    this.cargarTimeline(id);
  }

  cargarSolicitud(id: number): void {
    this.httpService.obtenerPorId(id).subscribe({
      next: (data) => {
        this.solicitud.set(data);
        console.log('Solicitud cargada:', this.solicitud);
      }
    });
  }

  cargarTimeline(id?: number): void {
    const solId = id || this.solicitud()?.id;
    if (!solId) return;
    this.httpService.obtenerTimeline(solId).subscribe({
      next: (eventos) => {        
        this.eventosTimeline.set( eventos);
      }
    });
  }

  esRol(rol: RolUsuario): boolean {
    return this.rolService.usuarioActual().rol === rol;
  }

  obtenerClaseBadge(estado: EstadoSolicitud): string {
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

  obtenerIconoEstado(estado: EstadoSolicitud | number): string {
    switch (estado) {
      case EstadoSolicitud.Borrador: return 'bi-pencil-square text-secondary';
      case EstadoSolicitud.Enviada: return 'bi-send-fill text-info';
      case EstadoSolicitud.EnRevision: return 'bi-hourglass-split text-warning';
      case EstadoSolicitud.Aprobada: return 'bi-check-circle-fill text-success';
      case EstadoSolicitud.Rechazada: return 'bi-x-circle-fill text-danger';
      case EstadoSolicitud.Pagada: return 'bi-cash-coin text-primary';
      default: return 'bi-clock-history text-muted';
    }
  }

  // --- ACCIONES DE FLUJO DE TRABAJO ---
  enviarSolicitud(): void {
    if (!this.solicitud) return;
    this.httpService.enviar(this.solicitud()!.id).subscribe({
      next: (act) => {
        this.solicitud.set(act);
        this.cargarTimeline();
        this.notify.success('¡Solicitud enviada a revisión técnica exitosamente!');
      }
    });
  }

  iniciarRevision(): void {
    if (!this.solicitud) return;
    const revId = this.rolService.usuarioActual().id;
    this.httpService.iniciarRevision(this.solicitud()!.id, revId).subscribe({
      next: (act) => {
        this.solicitud.set(act);
        this.cargarTimeline();
        this.notify.info('Revisión técnica iniciada por el revisor.');
      }
    });
  }

  // --- MODAL DICTAMEN (APROBAR / RECHAZAR) ---
  abrirModalDictamen(tipo: 'aprobar' | 'rechazar'): void {
    this.dictamenTipo.set(tipo);
    this.dictamenComentario.set('');
    this.modalDictamenAbierto.set(true);
  }

  cancelarDictamen(): void {
    this.modalDictamenAbierto.set(false);
  }

  confirmarDictamen(): void {
    if (!this.solicitud) return;
    const tipo = this.dictamenTipo();
    const comentario = this.dictamenComentario().trim();
    const usuarioId = this.rolService.usuarioActual().id;

    if (tipo === 'rechazar' && !comentario) {
      this.notify.warning('El motivo de rechazo es obligatorio para el dictamen.');
      return;
    }

    if (tipo === 'aprobar') {
      this.httpService.aprobar(this.solicitud()!.id, comentario, usuarioId).subscribe({
        next: (act) => {
          this.solicitud.set(act);
          this.cargarTimeline();
          this.notify.success(`¡Solicitud ${act.codigo} aprobada formalmente!`);
          this.modalDictamenAbierto.set(false);
        }
      });
    } else {
      this.httpService.rechazar(this.solicitud()!.id, comentario, usuarioId).subscribe({
        next: (act) => {
          this.solicitud.set(act);
          this.cargarTimeline();
          this.notify.error(`Solicitud ${act.codigo} ha sido rechazada.`);
          this.modalDictamenAbierto.set(false);
        }
      });
    }
  }

  // --- MODAL PAGO (TESORERÍA) ---
  abrirModalPago(): void {
    this.pagoMedio.set('Transferencia Bancaria');
    this.pagoOperacion.set(`OP-${Math.floor(100000 + Math.random() * 900000)}`);
    this.modalPagoAbierto.set(true);
  }

  cancelarPago(): void {
    this.modalPagoAbierto.set(false);
  }

  confirmarPago(): void {
    if (!this.solicitud) return;
    const medio = this.pagoMedio();
    const op = this.pagoOperacion().trim();
    const usuarioId = this.rolService.usuarioActual().id;

    if (!op) {
      this.notify.warning('El número de operación bancaria es requerido.');
      return;
    }

    this.httpService.pagar(this.solicitud()!.id, medio, op, usuarioId).subscribe({
      next: (act) => {
        this.solicitud.set(act);
        this.cargarTimeline();
        this.notify.success(`¡Desembolso y pago registrado exitosamente en Tesorería (${medio})!`);
        this.modalPagoAbierto.set(false);
      }
    });
  }
}
