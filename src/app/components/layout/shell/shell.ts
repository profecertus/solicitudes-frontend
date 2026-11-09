import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../navbar/navbar';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SolicitudService } from '../../../services/solicitud.service';
import { EstadoSolicitud } from '../../../models/solicitud.model';

@Component({
  selector: 'app-shell',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, Navbar],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell implements OnInit {
  private readonly solicitudService = inject(SolicitudService);

  readonly conteoAprobaciones = computed(() =>
    this.solicitudService.solicitudes().filter(s =>
      s.estado === EstadoSolicitud.Enviada || s.estado === EstadoSolicitud.EnRevision
    ).length
  );

  readonly conteoTesoreria = computed(() =>
    this.solicitudService.solicitudes().filter(s =>
      s.estado === EstadoSolicitud.Aprobada
    ).length
  );

  ngOnInit(): void {
    this.solicitudService.obtenerPaginado(1, 50).subscribe();
  }
}

