import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Solicitud } from '../../models/solicitud.model';

@Component({
  selector: 'app-solicitud-card',
  imports: [CommonModule],
  templateUrl: './solicitud-card.html',
  styleUrl: './solicitud-card.css',
})
export class SolicitudCard {
  @Input({required: true}) solicitud! : Solicitud;

  obtenerClaseBadge(estado: string): string{
    switch (estado.toLowerCase()){
      case 'borrador': return 'badge-borrador';
      case 'enviada': return 'badge-enviada';
      case 'enrevision': return 'badge-enrevision';
      case 'aprobada': return 'badge-aprobada';
      case 'rechazada': return 'badge-rechazada';
      case 'pagada': return 'badge-pagada';
      default: return 'bg-secondary';
    }
  }
}
