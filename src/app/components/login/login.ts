import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);

  readonly cargando = signal<boolean>(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mostrarPassword = signal<boolean>(false);

  // Formulario reactivo que consume POST /api/auth/login enviando usuario/correo, password y TTL en segundos
  readonly loginForm = this.fb.group({
    email: ['ana.torres', [Validators.required, Validators.minLength(3)]],
    password: ['123456', [Validators.required, Validators.minLength(6)]],
    ttlSegundos: [20, [Validators.required, Validators.min(5)]],
    recordar: [true]
  });

  ngOnInit(): void {
    const emailRecordado = this.authService.obtenerUltimoEmail();
    if (emailRecordado) {
      const ttlInicial = emailRecordado.toLowerCase().startsWith('ana.torres') ? 20 : 3600;
      this.loginForm.patchValue({ email: emailRecordado, ttlSegundos: ttlInicial });
    }
  }

  esInvalido(campo: string): boolean {
    const control = this.loginForm.get(campo);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  togglePassword(): void {
    this.mostrarPassword.update(v => !v);
  }

  ingresar(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, ttlSegundos, recordar } = this.loginForm.getRawValue();
    if (!email || !password) return;

    this.cargando.set(true);
    this.mensajeError.set(null);

    this.authService.login(email, password, !!recordar, undefined, ttlSegundos ?? 20).subscribe({
      next: (user) => {
        this.cargando.set(false);
        this.notify.success(
          `¡Bienvenido(a), ${user.nombre}! JWT generado con TTL de ${user.ttlSeconds} segundos.`
        );

        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.cargando.set(false);
        this.mensajeError.set(err?.message || 'Credenciales inválidas o error al conectar con el backend.');
      }
    });
  }

  // Acceso rápido para demostraciones consumiendo las credenciales reales de la BD
  seleccionarDemo(usuarioOCorreo: string, password: string = '123456', ttlSegundos: number = 3600): void {
    this.loginForm.patchValue({
      email: usuarioOCorreo,
      password: password,
      ttlSegundos: ttlSegundos,
      recordar: true
    });
    this.ingresar();
  }
}
