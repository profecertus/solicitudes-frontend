import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap, throwError } from 'rxjs';
import { RolUsuario, UsuarioActivo } from '../models/solicitud.model';
import { RolService } from './rol.service';
import { StorageService } from './storage.service';

export interface UsuarioAuth extends UsuarioActivo {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly rolService = inject(RolService);
  private readonly storage = inject(StorageService);

  private readonly TOKEN_KEY = 'solicitudes_token';
  private readonly USER_KEY = 'solicitudes_user';
  private readonly REMEMBER_KEY = 'solicitudes_recordar_email';

  // Signal reactivo del usuario actualmente autenticado
  readonly currentUser = signal<UsuarioAuth | null>(this.obtenerSesionGuardada());

  // Señal computada para saber si hay sesión activa
  readonly isAuthenticated = computed(() => !!this.currentUser());

  // Usuarios de prueba del sistema
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

  /**
   * Autentica al usuario y persiste el token y los datos del usuario en localStorage o sessionStorage.
   * @param correo Email corporativo
   * @param contrasena Contraseña
   * @param recordar Si es true, almacena en localStorage permanente; si es false, solo en sessionStorage
   */
  login(correo: string, contrasena: string, recordar: boolean = true): Observable<UsuarioAuth> {
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
        if (recordar) {
          // Guardar en localStorage (permanente entre reinicios del navegador)
          this.storage.set(this.TOKEN_KEY, user.token);
          this.storage.set(this.USER_KEY, user);
          this.storage.set(this.REMEMBER_KEY, user.email);
        } else {
          // Guardar temporalmente en sessionStorage y limpiar persistencia de localStorage
          sessionStorage.setItem(this.TOKEN_KEY, user.token);
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.storage.remove(this.TOKEN_KEY);
          this.storage.remove(this.USER_KEY);
        }

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

  /**
   * Cierra la sesión activa, eliminando los datos de localStorage y sessionStorage.
   */
  logout(): void {
    // Limpiar localStorage mediante StorageService
    this.storage.remove(this.TOKEN_KEY);
    this.storage.remove(this.USER_KEY);

    // Limpiar también sessionStorage por seguridad
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
    }

    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Obtiene el último email recordado en localStorage para precargar el formulario.
   */
  obtenerUltimoEmail(): string | null {
    return this.storage.get<string>(this.REMEMBER_KEY);
  }

  /**
   * Recupera la sesión guardada evaluando primero localStorage y luego sessionStorage.
   */
  private obtenerSesionGuardada(): UsuarioAuth | null {
    // 1. Intentar desde localStorage (persistente)
    const localUser = this.storage.get<UsuarioAuth>(this.USER_KEY);
    const localToken = this.storage.get<string>(this.TOKEN_KEY);
    if (localUser && localToken) {
      return localUser;
    }

    // 2. Intentar desde sessionStorage (temporal)
    if (typeof window !== 'undefined') {
      try {
        const sessionUser = sessionStorage.getItem(this.USER_KEY);
        const sessionToken = sessionStorage.getItem(this.TOKEN_KEY);
        if (sessionUser && sessionToken) {
          return JSON.parse(sessionUser) as UsuarioAuth;
        }
      } catch {
        // Ignorar error de parsing
      }
    }

    return null;
  }
}
