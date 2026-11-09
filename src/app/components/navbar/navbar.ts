import { Component, inject, signal } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { RolService } from '../../services/rol.service';
import { RolUsuario } from '../../models/solicitud.model';
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
  rolService = inject(RolService);
  authService = inject(AuthService);

  readonly sidebarAbierto = signal<boolean>(false);

  toggleSidebar(): void {
    this.sidebarAbierto.update(v => !v);
  }

  onRolChange(event:Event): void {
    const select = event.target as HTMLSelectElement;
    const nuevoRol = select.value as RolUsuario;
    this.rolService.cambiarRol(nuevoRol);
    this.notificationService.info(`Rol cambiado a: ${nuevoRol}`);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.notificationService.info('Sesión cerrada correctamente');
  }
}
