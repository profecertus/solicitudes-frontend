import { CommonModule } from "@angular/common";
import { Component, computed, inject, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { SolicitudService } from "../../services/solicitud.service";
import { EstadoSolicitud } from "../../models/solicitud.model";

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, RouterLink],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
    private service = inject(SolicitudService);

    readonly totalSolicitudes = computed(() => this.service.solicitudes().length);
    readonly totalEnRevision = computed(() => 
        this.service.solicitudes().filter(s => s.estado === EstadoSolicitud.EnRevision || s.estado === EstadoSolicitud.Enviada).length
    );
    readonly totalAprobadas = computed(() => 
        this.service.solicitudes().filter(s => s.estado === EstadoSolicitud.Aprobada).length
    );
    readonly totalMonto = computed(() => this.service.solicitudes().reduce((acc, s) => acc + s.montoTotal, 0));

    ngOnInit(): void {
        this.service.obtenerPaginado(1, 50).subscribe();
    }
}
