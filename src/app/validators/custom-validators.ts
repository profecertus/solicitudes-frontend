import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function motivoMinimoPalabrasValidator(minPalabras: number): ValidatorFn{
    return (control: AbstractControl) : ValidationErrors | null => {
        if (!control.value) return null;
        const palabras = control.value.trim().split(/\s+/).filter((p:string) => p.length > 0);
        return palabras.length >= minPalabras ? null : {
            motivoInsuficiente:{
                palabrasActuales:palabras.length, 
                requeridad:minPalabras
            }
        }
    }
}