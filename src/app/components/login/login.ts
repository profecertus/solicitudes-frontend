import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { RolUsuario } from '../../models/solicitud.model';

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

  // Formulario reactivo con soporte para persistencia en localStorage
  readonly loginForm = this.fb.group({
    email: ['ana.torres@solicitudes.com', [Validators.required, Validators.email]],
    password: ['123456', [Validators.required, Validators.minLength(6)]],
    recordar: [true] // Checkbox para indicar guardado permanente en localStorage
  });

  ngOnInit(): void {
    // Si hay un email recordado en localStorage, precargarlo en el formulario
    const emailRecordado = this.authService.obtenerUltimoEmail();
    if (emailRecordado) {
      this.loginForm.patchValue({ email: emailRecordado });
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

    const { email, password, recordar } = this.loginForm.getRawValue();
    if (!email || !password) return;

    this.cargando.set(true);
    this.mensajeError.set(null);

    this.authService.login(email, password, !!recordar).subscribe({
      next: (user) => {
        this.cargando.set(false);
        this.notify.success(`¡Bienvenido(a), ${user.nombre}! Has ingresado con el rol ${user.rol}.`);
        
        // Redirigir a la URL previa o a /dashboard
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.cargando.set(false);
        this.mensajeError.set(err.message || 'Error al autenticar.');
        this.notify.error('Credenciales incorrectas');
      }
    });
  }

  // Acceso rápido para demostraciones y pruebas del flujo
  seleccionarDemo(email: string, rol: string): void {
    this.loginForm.patchValue({
      email: email,
      password: '123456',
      recordar: true
    });
    this.ingresar();
  }
}
