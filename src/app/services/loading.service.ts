import { Injectable, signal } from "@angular/core";

@Injectable({
    providedIn:'root'
})
export class LoadingServices{
    readonly estaCargando = signal<boolean>(false);

    mostrar():void{
        this.estaCargando.set(true);
    }

    ocultar():void{
        this.estaCargando.set(false);
    }
}