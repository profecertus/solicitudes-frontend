import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Solicitud, EstadoSolicitud } from '../../models/solicitud.model';
import { SolicitudCard } from '../solicitud-card/solicitud-card';
import { SolicitudService } from '../../services/solicitud.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SolicitudFiltro } from './components/solicitud-filtro/solicitud-filtro';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-solicitudes-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './solicitudes-list.html',
  styleUrl: './solicitudes-list.css',
})
export class SolicitudesList implements OnInit {
  readonly servicio = inject(SolicitudService);
  private notify = inject(NotificationService);
  readonly filtro = signal<string>('');
  readonly solicitudAEliminar = signal<Solicitud | null>(null);

  readonly solicitudesFiltradas = computed( () => {
    const query = this.filtro().toLowerCase().trim();
    const list = this.servicio.solicitudes();
    if(!query) return list;
    return list.filter(s =>
      s.codigo.toLowerCase().includes(query) ||
      s.motivo.toLowerCase().includes(query) ||
      s.solicitanteNombre.toLowerCase().includes(query) ||
      s.estadoNombre.toLowerCase().includes(query)
    );
  }); 

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos():void{
    this.servicio.obtenerPaginado(1,50).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  onFiltroChange(event:Event):void{
    const input = event.target as HTMLInputElement;
    this.filtro.set(input.value);
  }

  limpiarFiltro():void{
    this.filtro.set('');
  }

  obtenerClaseBadge(estado: EstadoSolicitud):string{
    switch(estado){
      case EstadoSolicitud.Borrador: return 'badge bg-secondary'
      case EstadoSolicitud.Enviada: return 'badge bg-info text-dark'
      case EstadoSolicitud.EnRevision: return 'badge bg-warning text-dark'
      case EstadoSolicitud.Aprobada: return 'badge bg-success'
      case EstadoSolicitud.Rechazada: return 'badge bg-danger'
      case EstadoSolicitud.Pagada: return 'badge bg-primary'
      default: return 'badge bg-secondary'
    }
  }

  abrirConfirmarEliminar(solicitud: Solicitud):void{
    console.log(solicitud);
    this.solicitudAEliminar.set(solicitud);
  }

  cancelarEliminar():void{
    this.solicitudAEliminar.set(null);
  }

  confirmarEliminacion():void{
    const item = this.solicitudAEliminar();
    if(!item) return;

    this.servicio.eliminar(item.id).subscribe({
      next:()=>{
        this.notify.success(`Solicitud ${item.codigo} removida de la bandeja local en forma exitosa.`);
        this.solicitudAEliminar.set(null);
      },
      error:()=>{
        this.servicio.solicitudes.update(list => list.filter(s => s.id !== item.id));
        this.notify.info(`Solicitud ${item.codigo} removido`);
        this.solicitudAEliminar.set(null);
      }
    });
  }

}
