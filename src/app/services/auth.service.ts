import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthResponseDto,
  JwtTokenDto,
  LoginRequestDto,
  RolUsuario,
  UsuarioActivo
} from '../models/solicitud.model';
import { NotificationService } from './notification.service';
import { RolService } from './rol.service';
import { StorageService } from './storage.service';

export interface UsuarioAuth extends UsuarioActivo {
  username: string;
  correo: string;
  roles: string[];
  token: string;
  tokenType: string;
  ttlSeconds: number;
  ttlMinutes: number;
  fechaEmisionUtc: string;
  expiracion: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly rolService = inject(RolService);
  private readonly storage = inject(StorageService);
  private readonly notify = inject(NotificationService);

  private readonly baseUrl = `${environment.apiUrl}/Auth`;
  private readonly TOKEN_KEY = 'solicitudes_token';
  private readonly USER_KEY = 'solicitudes_user';
  private readonly REMEMBER_KEY = 'solicitudes_recordar_email';

  private ttlIntervalId: ReturnType<typeof setInterval> | null = null;
  private ultimaActividadMs: number = Date.now();
  private listenersActivos = false;

  // Eventos del navegador que reinician el contador de inactividad
  private readonly eventosActividad: (keyof WindowEventMap)[] = [
    'mousemove',
    'mousedown',
    'keydown',
    'scroll',
    'touchstart',
    'click'
  ];

  private readonly onUserActivityBound = () => this.registrarActividad();

  // Signal reactivo del usuario actualmente autenticado
  readonly currentUser = signal<UsuarioAuth | null>(this.obtenerSesionGuardada());

  // Signal reactivo con los segundos restantes del TTL por inactividad
  readonly ttlRestanteSegundos = signal<number>(this. currentUser()?.ttlSeconds ?? 0);

  // Texto formateado del TTL restante por inactividad (ej. "0m 20s")
  readonly ttlFormateado = computed(() => {
    const seg = this.ttlRestanteSegundos();
    if (seg <= 0) return 'Expirado';
    const min = Math.floor(seg / 60);
    const remSeg = seg % 60;
    if (min >= 60) {
      const hrs = Math.floor(min / 60);
      const remMin = min % 60;
      return `${hrs}h ${remMin}m ${remSeg}s`;
    }
    return `${min}m ${String(remSeg).padStart(2, '0')}s`;
  });

  // Señal computada para saber si hay sesión activa y con TTL vigente
  readonly isAuthenticated = computed(() => {
    const user = this.currentUser();
    return !!user && !!user.token && this.ttlRestanteSegundos() > 0;
  });

  constructor() {
    const guardado = this.currentUser();
    if (guardado) {
      this.ultimaActividadMs = Date.now();
      this.ttlRestanteSegundos.set(guardado.ttlSeconds || 20);
      this.sincronizarRolService(guardado);
      this.iniciarMonitorTtlInactividad();
    }
  }

  ngOnDestroy(): void {
    this.detenerMonitorTtlInactividad();
  }

  /**
   * Reinicia el contador de TTL cada vez que se detecta actividad del usuario (teclado, mouse, clic o petición HTTP).
   */
  registrarActividad(): void {
    const user = this.currentUser();
    if (!user) return;

    const ahora = Date.now();
    this.ultimaActividadMs = ahora;

    const ttlTotal = user.ttlSeconds > 0 ? user.ttlSeconds : 20;
    if (this.ttlRestanteSegundos() !== ttlTotal) {
      this.ttlRestanteSegundos.set(ttlTotal);
    }
  }

  /**
   * Autentica al usuario contra el backend (POST /api/auth/login), obtiene el JWT con su TTL
   * e inicia el monitor de expiración por inactividad.
   */
  login(
    usuarioOCorreo: string,
    contrasena: string,
    recordar: boolean = true,
    ttlMinutos?: number,
    ttlSegundos?: number
  ): Observable<UsuarioAuth> {
    const credencial = usuarioOCorreo.trim();
    const payload: LoginRequestDto = {
      usuario: credencial,
      username: credencial,
      correo: credencial,
      email: credencial,
      password: contrasena,
      ttlMinutos,
      ttlSegundos
    };

    return this.http.post<AuthResponseDto>(`${this.baseUrl}/login`, payload).pipe(
      map(res => this.mapearRespuestaAuth(res)),
      tap(user => {
        this.guardarSesion(user, recordar);
      })
    );
  }

  /**
   * Solicita al backend únicamente la generación de un nuevo JWT con un TTL específico
   * (POST /api/auth/token) y actualiza el token activo si hay sesión iniciada.
   */
  generarTokenConTtl(
    usuarioOCorreo: string,
    contrasena: string,
    ttlMinutos?: number,
    ttlSegundos?: number
  ): Observable<JwtTokenDto> {
    const credencial = usuarioOCorreo.trim();
    const payload: LoginRequestDto = {
      usuario: credencial,
      username: credencial,
      correo: credencial,
      email: credencial,
      password: contrasena,
      ttlMinutos,
      ttlSegundos
    };

    return this.http.post<JwtTokenDto>(`${this.baseUrl}/token`, payload).pipe(
      tap(jwtDto => {
        const actual = this.currentUser();
        if (actual) {
          const actualizado: UsuarioAuth = {
            ...actual,
            token: jwtDto.token,
            tokenType: jwtDto.tokenType || 'Bearer',
            ttlSeconds: jwtDto.ttlSeconds,
            ttlMinutes: jwtDto.ttlMinutes,
            fechaEmisionUtc: jwtDto.fechaEmisionUtc,
            expiracion: jwtDto.fechaExpiracionUtc
          };
          const usaLocalStorage = !!this.storage.get<string>(this.TOKEN_KEY);
          this.guardarSesion(actualizado, usaLocalStorage);
        }
      })
    );
  }

  /**
   * Consulta en el backend (GET /api/auth/me) los claims del token actual.
   */
  obtenerSesionServidor(): Observable<{
    id: string;
    username: string;
    nombre: string;
    correo: string;
    roles: string[];
    expiracionUtc: string;
    ttlRestanteSegundos: number;
  }> {
    return this.http.get<{
      id: string;
      username: string;
      nombre: string;
      correo: string;
      roles: string[];
      expiracionUtc: string;
      ttlRestanteSegundos: number;
    }>(`${this.baseUrl}/me`).pipe(
      tap(() => this.registrarActividad())
    );
  }

  /**
   * Obtiene el token JWT vigente para adjuntarlo en el encabezado Authorization: Bearer.
   */
  obtenerToken(): string | null {
    const user = this.currentUser();
    if (user && user.token && this.ttlRestanteSegundos() > 0) {
      return user.token;
    }
    return null;
  }

  /**
   * Cierra la sesión activa, limpiando localStorage, sessionStorage y el monitor de inactividad.
   */
  logout(redirigir: boolean = true): void {
    this.detenerMonitorTtlInactividad();
    this.storage.remove(this.TOKEN_KEY);
    this.storage.remove(this.USER_KEY);

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
    }

    this.currentUser.set(null);
    this.ttlRestanteSegundos.set(0);

    if (redirigir) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Obtiene el último usuario/email recordado en localStorage para precargar el formulario.
   */
  obtenerUltimoEmail(): string | null {
    return this.storage.get<string>(this.REMEMBER_KEY);
  }

  private guardarSesion(user: UsuarioAuth, recordar: boolean): void {
    this.ultimaActividadMs = Date.now();
    const ttlInicial = user.ttlSeconds > 0 ? user.ttlSeconds : 20;
    user.expiracion = new Date(this.ultimaActividadMs + ttlInicial * 1000).toISOString();

    if (recordar) {
      this.storage.set(this.TOKEN_KEY, user.token);
      this.storage.set(this.USER_KEY, user);
      this.storage.set(this.REMEMBER_KEY, user.username || user.email);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
      }
    } else {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(this.TOKEN_KEY, user.token);
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
      }
      this.storage.remove(this.TOKEN_KEY);
      this.storage.remove(this.USER_KEY);
    }

    this.currentUser.set(user);
    this.ttlRestanteSegundos.set(ttlInicial);
    this.sincronizarRolService(user);
    this.iniciarMonitorTtlInactividad();
  }

  private sincronizarRolService(user: UsuarioAuth): void {
    this.rolService.usuarioActual.set({
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol
    });
  }

  private mapearRespuestaAuth(res: AuthResponseDto): UsuarioAuth {
    const rolNormalizado = this.normalizarRol(res.rol || res.roles?.[0]);
    return {
      id: res.id,
      username: res.username || res.correo?.split('@')[0] || '',
      nombre: res.nombre,
      correo: res.correo || res.email,
      email: res.email || res.correo,
      rol: rolNormalizado,
      roles: res.roles || [rolNormalizado],
      token: res.token,
      tokenType: res.tokenType || 'Bearer',
      ttlSeconds: res.ttlSeconds,
      ttlMinutes: res.ttlMinutes,
      fechaEmisionUtc: res.fechaEmisionUtc,
      expiracion: res.expiracion
    };
  }

  private normalizarRol(rolBackend?: string): RolUsuario {
    if (!rolBackend) return RolUsuario.Usuario;
    switch (rolBackend.toLowerCase()) {
      case 'revisor':
        return RolUsuario.Revisor;
      case 'aprobador':
        return RolUsuario.Aprobador;
      case 'tesoreria':
      case 'tesorería':
        return RolUsuario.Tesoreria;
      case 'solicitante':
        return RolUsuario.Solicitante;
      case 'usuario':
      default:
        return RolUsuario.Usuario;
    }
  }

  private obtenerSesionGuardada(): UsuarioAuth | null {
    const localUser = this.storage.get<UsuarioAuth>(this.USER_KEY);
    const localToken = this.storage.get<string>(this.TOKEN_KEY);
    if (localUser && localToken) {
      return localUser;
    }

    if (typeof window !== 'undefined') {
      try {
        const sessionUserRaw = sessionStorage.getItem(this.USER_KEY);
        const sessionToken = sessionStorage.getItem(this.TOKEN_KEY);
        if (sessionUserRaw && sessionToken) {
          return JSON.parse(sessionUserRaw) as UsuarioAuth;
        }
      } catch {
        // Ignorar error de parsing
      }
    }

    return null;
  }

  private iniciarMonitorTtlInactividad(): void {
    this.detenerMonitorTtlInactividad();
    if (typeof window === 'undefined') return;

    this.registrarListenersActividad();

    this.ttlIntervalId = setInterval(() => {
      const user = this.currentUser();
      if (!user) {
        this.detenerMonitorTtlInactividad();
        return;
      }

      const ttlTotal = user.ttlSeconds > 0 ? user.ttlSeconds : 20;
      const segundosInactivo = Math.floor((Date.now() - this.ultimaActividadMs) / 1000);
      const restantes = Math.max(0, ttlTotal - segundosInactivo);

      this.ttlRestanteSegundos.set(restantes);

      if (restantes <= 0) {
        this.notify.warning(
          `Sesión cerrada por inactividad (${ttlTotal}s sin actividad). Por favor, inicia sesión nuevamente.`
        );
        this.logout(true);
      }
    }, 1000);
  }

  private detenerMonitorTtlInactividad(): void {
    if (this.ttlIntervalId !== null) {
      clearInterval(this.ttlIntervalId);
      this.ttlIntervalId = null;
    }
    this.removerListenersActividad();
  }

  private registrarListenersActividad(): void {
    if (typeof window === 'undefined' || this.listenersActivos) return;
    for (const evento of this.eventosActividad) {
      window.addEventListener(evento, this.onUserActivityBound, { passive: true });
    }
    this.listenersActivos = true;
  }

  private removerListenersActividad(): void {
    if (typeof window === 'undefined' || !this.listenersActivos) return;
    for (const evento of this.eventosActividad) {
      window.removeEventListener(evento, this.onUserActivityBound);
    }
    this.listenersActivos = false;
  }
}
