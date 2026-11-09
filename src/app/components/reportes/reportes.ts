import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../../services/solicitud.service';
import { ExportService } from '../../services/export.service';
import { NotificationService } from '../../services/notification.service';
import { EstadoSolicitud, Solicitud } from '../../models/solicitud.model';

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class ReportesComponent implements OnInit {
  readonly solicitudService = inject(SolicitudService);
  private readonly exportService = inject(ExportService);
  private readonly notify = inject(NotificationService);

  readonly EstadoSolicitud = EstadoSolicitud;

  // Filtros interactivos
  readonly filtroTexto = signal<string>('');
  readonly filtroEstado = signal<string>('0'); // 0 = Todos
  readonly filtroCentroCosto = signal<string>('0'); // 0 = Todos
  readonly filtroFechaInicio = signal<string>('');
  readonly filtroFechaFin = signal<string>('');

  // Centros de costo disponibles
  readonly centrosCosto = [
    { id: 1, nombre: 'Tecnologías de la Información' },
    { id: 2, nombre: 'Operaciones y Logística' },
    { id: 3, nombre: 'Ventas y Marketing' },
    { id: 4, nombre: 'Finanzas y Contabilidad' }
  ];

  // Estados disponibles
  readonly estados = [
    { id: EstadoSolicitud.Borrador, nombre: 'Borrador' },
    { id: EstadoSolicitud.Enviada, nombre: 'Enviada' },
    { id: EstadoSolicitud.EnRevision, nombre: 'En Revisión' },
    { id: EstadoSolicitud.Aprobada, nombre: 'Aprobada' },
    { id: EstadoSolicitud.Rechazada, nombre: 'Rechazada' },
    { id: EstadoSolicitud.Pagada, nombre: 'Pagada' }
  ];

  // Solicitudes filtradas
  readonly solicitudesFiltradas = computed(() => {
    let lista = this.solicitudService.solicitudes();

    const q = this.filtroTexto().toLowerCase().trim();
    if (q) {
      lista = lista.filter(s =>
        s.codigo.toLowerCase().includes(q) ||
        s.motivo.toLowerCase().includes(q) ||
        s.solicitanteNombre.toLowerCase().includes(q) ||
        s.estadoNombre.toLowerCase().includes(q)
      );
    }

    const est = parseInt(this.filtroEstado(), 10);
    if (est > 0) {
      lista = lista.filter(s => s.estado === est);
    }

    const cc = parseInt(this.filtroCentroCosto(), 10);
    if (cc > 0) {
      lista = lista.filter(s => s.centroCostoId === cc);
    }

    const fInicio = this.filtroFechaInicio();
    if (fInicio) {
      const dInicio = new Date(fInicio + 'T00:00:00');
      lista = lista.filter(s => new Date(s.fechaCreacion) >= dInicio);
    }

    const fFin = this.filtroFechaFin();
    if (fFin) {
      const dFin = new Date(fFin + 'T23:59:59');
      lista = lista.filter(s => new Date(s.fechaCreacion) <= dFin);
    }

    return lista;
  });

  // Métricas agregadas
  readonly totalFiltradas = computed(() => this.solicitudesFiltradas().length);
  readonly montoTotalFiltrado = computed(() =>
    this.solicitudesFiltradas().reduce((acc, s) => acc + s.montoTotal, 0)
  );
  readonly montoPagadoFiltrado = computed(() =>
    this.solicitudesFiltradas()
      .filter(s => s.estado === EstadoSolicitud.Pagada)
      .reduce((acc, s) => acc + s.montoTotal, 0)
  );
  readonly montoPendienteFiltrado = computed(() =>
    this.solicitudesFiltradas()
      .filter(s => s.estado === EstadoSolicitud.Aprobada)
      .reduce((acc, s) => acc + s.montoTotal, 0)
  );

  ngOnInit(): void {
    this.solicitudService.obtenerPaginado(1, 100).subscribe();
  }

  limpiarFiltros(): void {
    this.filtroTexto.set('');
    this.filtroEstado.set('0');
    this.filtroCentroCosto.set('0');
    this.filtroFechaInicio.set('');
    this.filtroFechaFin.set('');
  }

  exportarExcel(): void {
    const data = this.solicitudesFiltradas();
    if (data.length === 0) {
      this.notify.warning('No hay solicitudes filtradas para exportar');
      return;
    }
    this.exportService.exportarExcel(data, 'Reporte_Solicitudes_Compras');
    this.notify.success(`¡Reporte Excel generado exitosamente con ${data.length} registros!`);
  }

  exportarPdf(): void {
    const data = this.solicitudesFiltradas();
    if (data.length === 0) {
      this.notify.warning('No hay solicitudes filtradas para exportar');
      return;
    }

    const filtrosAplicados: string[] = [];
    const est = parseInt(this.filtroEstado(), 10);
    if (est > 0) {
      const nomEst = this.estados.find(e => e.id === est)?.nombre;
      filtrosAplicados.push(`Estado: ${nomEst}`);
    }
    const cc = parseInt(this.filtroCentroCosto(), 10);
    if (cc > 0) {
      const nomCc = this.centrosCosto.find(c => c.id === cc)?.nombre;
      filtrosAplicados.push(`Centro: ${nomCc}`);
    }
    if (this.filtroFechaInicio()) {
      filtrosAplicados.push(`Desde: ${this.filtroFechaInicio()}`);
    }
    if (this.filtroFechaFin()) {
      filtrosAplicados.push(`Hasta: ${this.filtroFechaFin()}`);
    }

    const textoFiltros = filtrosAplicados.length > 0 ? filtrosAplicados.join(' | ') : 'Todos los registros';
    this.exportService.exportarPdf(data, 'Reporte_Solicitudes_Compras', textoFiltros);
    this.notify.success(`¡Reporte PDF descargado con ${data.length} registros!`);
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
