import { Injectable, signal } from "@angular/core";

export interface ToastMensaje{
    id:number;
    texto:string;
    tipo: 'success' | 'danger' | 'warning' | 'info';
}

@Injectable({
    providedIn:'root'
})
export class NotificationService{
    readonly mensajes = signal<ToastMensaje[]>([]);

    mostrar(texto:string, tipo: 'success' | 'danger' |  'warning' | 'info' = 'info', duracionMs = 4500):void{
        const id = Date.now() + Math.random();
        this.mensajes.update(list => [...list, {id, texto, tipo}]);
        setTimeout(() => this.remover(id), duracionMs);
    }

    success(texto:string):void{
        this.mostrar(texto, 'success', 3500);
    }

    error(texto:string):void{
        this.mostrar(texto, 'danger', 6000);
    }


    warning(texto:string):void{
        this.mostrar(texto, 'warning', 4500);
    }

    info(texto:string):void{
        this.mostrar(texto, 'info', 4000);
    }

    remover(id:number):void{
        this.mensajes.update(list => list.filter(m => m.id !== id));
    }
}