import { Component, input, output, computed, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { SolicitudDetalleForm } from "../../../../models/solicitud.model";

@Component({
    selector:'app-solicitud-renglones',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './solicitud-renglones.html',
    styleUrl: './solicitud-renglones.css'
})
export class SolicitudRenglones{    
    readonly renglones = input.required<SolicitudDetalleForm[]>();
    readonly totalEstimado = input.required<number>();

    readonly agregar = output<void>();
    readonly eliminar = output<number>();
    readonly actualizarCampo = output<{index:number; campo: keyof SolicitudDetalleForm; valor: any}>();

    readonly puedeEliminar = computed(()=> this.renglones().length > 1);

    onAgregar(){
        this.agregar.emit();
    }

    onEliminar(index: number){
        if (this.puedeEliminar()){
            this.eliminar.emit(index);
        }
    }

    onConceptoChange(index: number, event:Event){
        const valor = (event.target as HTMLInputElement).value;
        this.actualizarCampo.emit({index, campo:'concepto', valor});
    }

    onCantidadChange(index:number, event: Event){
        const valor = Number((event.target as HTMLInputElement).value);
        this.actualizarCampo.emit({index, campo: 'cantidad', valor});
    }
    
    onPrecioChange(index:number, event: Event){
        const valor = Number((event.target as HTMLInputElement).value);
        this.actualizarCampo.emit({index, campo: 'precioUnitario', valor});
    }
}   