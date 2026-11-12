import { Component, inject, signal } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { LoadingServices } from '../../services/loading.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  loadingService = inject(LoadingServices);
  notificationService = inject(NotificationService);
  authService = inject(AuthService);

  readonly sidebarAbierto = signal<boolean>(false);

  toggleSidebar(): void {
    this.sidebarAbierto.update(v => !v);
  }

  verificarTokenServidor(): void {
    this.authService.obtenerSesionServidor().subscribe({
      next: (info) => {
        this.notificationService.success(
          `JWT válido en servidor para @${info.username} | TTL restante: ${info.ttlRestanteSegundos}s`
        );
      }
    });
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.notificationService.info('Sesión cerrada correctamente');
  }
}
