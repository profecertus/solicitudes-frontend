import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SolicitudService } from '../../services/solicitud.service';
import { SolicitudRenglones } from './components/solicitud-renglones/solicitud-renglones';
import { CrearSolicitudDto, SolicitudDetalleForm } from '../../models/solicitud.model';
import { motivoMinimoPalabrasValidator } from '../../validators/custom-validators';
import { validate } from '@angular/forms/signals';


@Component({
  selector: 'app-solicitud-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './solicitud-form.html',
  styleUrl: './solicitud-form.css',
})
export class SolicitudForm implements OnInit {
  private fb = inject(FormBuilder);
  private servicio = inject(SolicitudService);
  private router = inject(Router);

  formulario!: FormGroup;
  montoTotalCalculado = 0;
  guardando = false;

  readonly centrosCosto = [
    { id: 1, codigo: 'CC-TI-01', nombre: 'Tecnologías de la Información' },
    { id: 2, codigo: 'CC-OPS-02', nombre: 'Operaciones y Logística' },
    { id: 3, codigo: 'CC-VEN-03', nombre: 'Ventas y Marketing' },
    { id: 4, codigo: 'CC-FIN-04', nombre: 'Finanzas y Contabilidad' }
  ];

  ngOnInit(): void {
    this.inicializarFormulario();
    this.escucharCambiosTotales();
  }

  private inicializarFormulario():void{
    this.formulario = this.fb.group({
      motivo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(250), motivoMinimoPalabrasValidator(3)]],
      centroCostoId: ['', [Validators.required, Validators.min(1)]],
      solicitanteId: [1, [Validators.required]],
      detalles: this.fb.array([], [Validators.required])
    });

    this.agregarFila();
  }

  get detalles(): FormArray{
    return this.formulario.get('detalles') as FormArray;
  }

  get motivoControl(){
    return this.formulario.get('motivo');
  }  

  get centroCostocontrol(){
    return this.formulario.get('centroCostoId');
  }

  crearFilaDetalle(concepto = '', cantidad = 1, precioUnitario = 0):FormGroup{
    return this.fb.group({
      concepto: [concepto, [Validators.required, Validators.minLength(3)]],
      cantidad: [cantidad, [Validators.required, Validators.min(1)]],
      precioUnitario: [precioUnitario, [Validators.required, Validators.min(0.01)]]
    });    
  }

  agregarFila():void{
    this.detalles.push(this.crearFilaDetalle());
    this.recalcularTotal();
  }

  calcularSubtotal(index: number):number{
    const fila = this.detalles.at(index);
    if (!fila) return 0;
    const cantidad = Number(fila.get('cantidad')?.value) || 0;
    const precio = Number(fila.get('precioUnitario')?.value)  || 0;
    return cantidad * precio;
  }

  private escucharCambiosTotales():void{
    this.detalles.valueChanges.subscribe(() =>{
      this.recalcularTotal();
    })
  }

  eliminarFila(index:number):void{
    if (this.detalles.length > 1){
      console.log(index);      
      this.detalles.removeAt(index);
      this.recalcularTotal();
    }
  }

  private recalcularTotal():void{
    this.montoTotalCalculado = this.detalles.controls.reduce( (acumulado, fila) => {
      const cantidad = Number(fila.get('cantidad')?.value) || 0;
      const precio = Number(fila.get('precioUnitario')?.value)  || 0;
      return acumulado + (cantidad * precio);
    }, 0);
  }

  esInvalido(nombreCampo: string):boolean{
    const control = this.formulario.get(nombreCampo);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  esDetalleInvalido(index:number, nombreCampo:string):boolean{
    const fila = this.detalles.at(index);
    if(!fila) return false;
    const control = fila.get(nombreCampo);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  guardar():void{
    if (this.formulario.invalid || this.detalles.length === 0){
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const dto: CrearSolicitudDto = {
      motivo: this.formulario.value.motivo.trim(),
      centroCostoId: Number(this.formulario.value.centroCostoId),
      //solicitanteId: Number(this.formulario.value.solicitanteId) || 1,
      solicitanteId: 3,
      detalles: this.detalles.value.map((d:any) => ({
        concepto: d.concepto.trim(),
        cantidad: Number(d.cantidad),
        precioUnitario: Number(d.precioUnitario)
      }))
    };

    this.servicio.crear(dto).subscribe({
      next: () => {
        this.router.navigate(['/solicitudes']);
      },
      error:(err) => {
        console.error('Error al guardar solicitud', err);
        this.guardando = false;
      }
    });
  }

}
