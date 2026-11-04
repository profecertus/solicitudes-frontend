import { Component, model, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
    selector: 'app-solicitud-filtro',
    imports: [CommonModule, FormsModule],
    templateUrl: './solicitud-filtro.html',
    styleUrl: './solicitud-filtro.css'
})
export class SolicitudFiltro{
    readonly busqueda = model<string>('');

    readonly totalResultados = input<number>(0);
    readonly placeholder = input<string>('Buscar por motivo, código o estado...');

    readonly limpiar = output<void>();

    onInput(event:Event){
        const inputElement = event.target as HTMLInputElement;
        this.busqueda.set(inputElement.value);
    }

    onLimpiar(){
        this.busqueda.set('');
        this.limpiar.emit();
    }
}