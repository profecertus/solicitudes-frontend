import { inject, Injectable, OnInit, signal } from "@angular/core";
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
    nombre: 'Edwin',
    email: 'edwin@miempresa.com',
    rol: RolUsuario.Solicitante
  });
  
  readonly rolesDisponibles:{
    rol:RolUsuario,
    id:number,
    nombre:string
    titulo:string
  }[] = []

  

  constructor() {
    this.UsuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.rolesDisponibles.splice(0, this.rolesDisponibles.length); // Limpiar el array antes de llenarlo nuevamente
        usuarios.forEach(usuario => {
          usuario.roles.forEach(rolItem => {
            const rolExistente = this.rolesDisponibles.find(r => r.id === rolItem.id);
            if (!rolExistente) {
              this.rolesDisponibles.push({
                rol: rolItem.nombre as RolUsuario,
                id: rolItem.id,
                nombre: usuario.nombre,
                titulo: `Rol: ${rolItem.nombre}, Límite de Aprobación: ${rolItem.limiteAprobacion}`
              });
            }
          });
        });        
      },
      error: (error) => {
        console.error('Error al obtener los usuarios en RolService:', error);
      }
    });    
  }

  cambiarRol(nuevoRol: RolUsuario): void {
    const item = this.rolesDisponibles.find(r => r.rol === nuevoRol);
    if(item){
      this.usuarioActual.set({
        id:item.id,
        nombre:item.nombre,
        email: `${item.rol.toLocaleLowerCase()}@miempresa.com`,
        rol: item.rol
      });
    }
  }
}