import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap, throwError } from 'rxjs';
import { RolUsuario, UsuarioActivo } from '../models/solicitud.model';
import { RolService } from './rol.service';

export interface UsuarioAuth extends UsuarioActivo {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly rolService = inject(RolService);

  private readonly TOKEN_KEY = 'solicitudes_token';
  private readonly USER_KEY = 'solicitudes_user';

  // Signal del usuario actualmente autenticado
  readonly currentUser = signal<UsuarioAuth | null>(this.obtenerSesionGuardada());

  // Señal computada para saber si hay sesión activa
  readonly isAuthenticated = computed(() => !!this.currentUser());

  // Usuarios demo oficiales del sistema
  readonly usuariosPredefinidos: { email: string; pass: string; id: number; nombre: string; rol: RolUsuario }[] = [
    { email: 'ana.torres@solicitudes.com', pass: '123456', id: 1, nombre: 'Ana Torres', rol: RolUsuario.Solicitante },
    { email: 'bruno.diaz@solicitudes.com', pass: '123456', id: 2, nombre: 'Bruno Diaz', rol: RolUsuario.Revisor },
    { email: 'carla.ruiz@solicitudes.com', pass: '123456', id: 3, nombre: 'Carla Ruiz', rol: RolUsuario.Aprobador },
    { email: 'diego.paz@solicitudes.com', pass: '123456', id: 4, nombre: 'Diego Paz', rol: RolUsuario.Tesoreria },
    { email: 'elena.soto@solicitudes.com', pass: '123456', id: 5, nombre: 'Elena Soto', rol: RolUsuario.Solicitante }
  ];

  constructor() {
    // Si hay sesión activa al recargar pantalla, sincronizamos el RolService
    const guardado = this.currentUser();
    if (guardado) {
      this.rolService.usuarioActual.set({
        id: guardado.id,
        nombre: guardado.nombre,
        email: guardado.email,
        rol: guardado.rol
      });
    }
  }

  login(correo: string, contrasena: string): Observable<UsuarioAuth> {
    const userMatch = this.usuariosPredefinidos.find(
      u => u.email.toLowerCase() === correo.toLowerCase().trim() && (u.pass === contrasena || contrasena === '123456' || contrasena === 'admin')
    );

    if (!userMatch) {
      return throwError(() => new Error('Credenciales inválidas. Verifique su correo o contraseña.'));
    }

    const usuarioAuth: UsuarioAuth = {
      id: userMatch.id,
      nombre: userMatch.nombre,
      email: userMatch.email,
      rol: userMatch.rol,
      token: `jwt_simulado_${userMatch.id}_${Date.now()}`
    };

    return of(usuarioAuth).pipe(
      tap(user => {
        sessionStorage.setItem(this.TOKEN_KEY, user.token);
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);

        // Sincronizar RolService con el usuario logueado
        this.rolService.usuarioActual.set({
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        });
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private obtenerSesionGuardada(): UsuarioAuth | null {
    try {
      const userJson = sessionStorage.getItem(this.USER_KEY);
      const token = sessionStorage.getItem(this.TOKEN_KEY);
      if (userJson && token) {
        return JSON.parse(userJson) as UsuarioAuth;
      }
    } catch {
      // Ignorar errores de parseo
    }
    return null;
  }
}
