import { computed, inject, Injectable, signal } from "@angular/core";
import { RolUsuario, Usuario, UsuarioActivo } from "../models/solicitud.model";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { UsuarioService } from "./usuario.service";

@Injectable({
  providedIn: 'root'
})
export class RolService {    
  private UsuarioService = inject(UsuarioService);
  private usuarios = signal<Usuario[]>([]);
  
  //Emular el usuario actual, en un escenario real, esto se obtendría del token de autenticación o del backend
  readonly usuarioActual = signal<UsuarioActivo>({
    id: 1,
    nombre: 'Ana Torres',
    email: 'eana.torres@solicitudes.com',
    rol: RolUsuario.Usuario
  });
  
  // computed: se recalcula solo cuando cambia el signal usuarios (necesario en modo zoneless)
  readonly rolesDisponibles = computed(() => {
    const roles: {
      rol: RolUsuario,
      id: number,
      usuarioId: number,
      nombre: string,
      correo: string,
      titulo: string
    }[] = [];
    for (const usuario of this.usuarios()) {
      for (const rolItem of usuario.roles) {
        if (!roles.some(r => r.id === rolItem.id)) {
          roles.push({
            rol: rolItem.nombre as RolUsuario,
            id: rolItem.id,
            usuarioId: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            titulo: `Rol: ${rolItem.nombre}, Límite de Aprobación: ${rolItem.limiteAprobacion}`
          });
        }
      }
    }
    return roles;
  });

  constructor() {
    this.UsuarioService.getUsuarios().subscribe({
      next: (usuarios) => this.usuarios.set(usuarios),
      error: (error) => console.error('Error al obtener los usuarios en RolService:', error)
    });
  }

  cambiarRol(nuevoRol: RolUsuario): void {
    const item = this.rolesDisponibles().find(r => r.rol === nuevoRol);
    if(item){
      this.usuarioActual.set({
        id: item.usuarioId,
        nombre: item.nombre,
        email: item.correo,
        rol: item.rol
      });
    }
  }
}