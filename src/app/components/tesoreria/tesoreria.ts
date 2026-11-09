import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../../services/solicitud.service';
import { TesoreriaService } from '../../services/tesoreria.service';
import { RolService } from '../../services/rol.service';
import { NotificationService } from '../../services/notification.service';
import { EstadoSolicitud, MovimientoTesoreriaDto, RolUsuario, Solicitud } from '../../models/solicitud.model';
import { HashIdPipe } from '../../pipes/hash-id.pipe';

@Component({
  selector: 'app-tesoreria',
  imports: [CommonModule, RouterLink, FormsModule, HashIdPipe],
  templateUrl: './tesoreria.html',
  styleUrl: './tesoreria.css'
})
export class TesoreriaComponent implements OnInit {
  readonly solicitudService = inject(SolicitudService);
  private readonly tesoreriaService = inject(TesoreriaService);
  readonly rolService = inject(RolService);
  private readonly notify = inject(NotificationService);

  readonly EstadoSolicitud = EstadoSolicitud;
  readonly RolUsuario = RolUsuario;

  readonly tabActiva = signal<'pendientes' | 'movimientos'>('pendientes');
  readonly movimientos = signal<MovimientoTesoreriaDto[]>([]);
  readonly filtroMovimientos = signal<string>('');

  // Modal de Pago
  readonly modalPagoAbierto = signal<boolean>(false);
  readonly solicitudSeleccionada = signal<Solicitud | null>(null);
  readonly pagoMedio = signal<string>('Transferencia Bancaria');
  readonly pagoOperacion = signal<string>('');

  // Computados
  readonly solicitudesPendientesPago = computed(() => {
    return this.solicitudService.solicitudes().filter(s => s.estado === EstadoSolicitud.Aprobada);
  });

  readonly totalMontoPendiente = computed(() => {
    return this.solicitudesPendientesPago().reduce((acc, s) => acc + s.montoTotal, 0);
  });

  readonly totalMontoPagado = computed(() => {
    return this.movimientos().reduce((acc, m) => acc + m.montoPagado, 0);
  });

  readonly movimientosFiltrados = computed(() => {
    const q = this.filtroMovimientos().toLowerCase().trim();
    const list = this.movimientos();
    if (!q) return list;
    return list.filter(m =>
      m.codigoSolicitud?.toLowerCase().includes(q) ||
      m.medio?.toLowerCase().includes(q) ||
      m.referencia?.toLowerCase().includes(q) ||
      m.creadoPor?.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.solicitudService.obtenerPaginado(1, 50).subscribe();
    this.cargarMovimientos();
  }

  cargarMovimientos(): void {
    this.tesoreriaService.listar().subscribe({
      next: (data) => this.movimientos.set(data),
      error: () => this.notify.error('No se pudo cargar el registro de tesorería')
    });
  }

  esRol(rol: RolUsuario): boolean {
    return this.rolService.usuarioActual().rol === rol;
  }

  abrirModalPago(solicitud: Solicitud): void {
    this.solicitudSeleccionada.set(solicitud);
    this.pagoMedio.set('Transferencia Bancaria');
    this.pagoOperacion.set(`TRX-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`);
    this.modalPagoAbierto.set(true);
  }

  cancelarPago(): void {
    this.modalPagoAbierto.set(false);
    this.solicitudSeleccionada.set(null);
  }

  confirmarPago(): void {
    const sol = this.solicitudSeleccionada();
    if (!sol) return;

    const medio = this.pagoMedio();
    const operacion = this.pagoOperacion().trim();
    const usuarioId = this.rolService.usuarioActual().id;

    if (!operacion) {
      this.notify.warning('El número de operación bancaria o referencia es obligatorio.');
      return;
    }

    this.solicitudService.pagar(sol.id, medio, operacion, usuarioId).subscribe({
      next: (act) => {
        this.notify.success(`¡Desembolso registrado! Solicitud ${act.codigo} marcada como Pagada.`);
        this.modalPagoAbierto.set(false);
        this.solicitudSeleccionada.set(null);
        this.cargarMovimientos();
      },
      error: () => this.notify.error('Error al registrar el pago en el servidor')
    });
  }
}
