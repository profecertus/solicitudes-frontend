import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { environment } from "../../environments/environment";
import { Usuario } from "../models/solicitud.model";
import { catchError, Observable, of, tap } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
    private httpService = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/Usuarios`;
    private usuarios = signal<Usuario[]>([]);

    getUsuarios(): Observable<Usuario[]> {
        return this.httpService.get<Usuario[]>(this.baseUrl).pipe(
            tap((usuarios: Usuario[]) => {                
                this.usuarios.set(usuarios);
            }),
            catchError((error) => {
                console.error('Error al obtener los usuarios:', error);
                return of([]);
            })
        );
    }
}

