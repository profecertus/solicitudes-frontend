import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { NotificationService } from "../services/notification.service";
import { inject } from "@angular/core";
import { catchError, throwError } from "rxjs";

export interface ProblemDetails{
    type?:string;
    title?:string;
    status?:number;
    detail?:string;
    errors?:Record<string, string[]>
}

export const errorInterceptors:HttpInterceptorFn = (req, next) => {
    const notify = inject(NotificationService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let mensajeError = 'Ha ocurrido un error inesperado en el servidor';

            if (error.status === 0){
                // Sin respuesta del servidor (caído, CORS, red). Con withFetch, error.error es un TypeError.
                mensajeError = 'No fue posible conectar con el servidor backend en localhost:5072';
            }else if(error.error && typeof error.error === 'object'){
                const problem = error.error as ProblemDetails;
                if(problem.detail){
                    mensajeError = problem.detail;
                }else if (problem.title){
                    mensajeError = problem.title;
                }else if(problem.errors){
                    const primer = Object.values(problem.errors).flat();
                    mensajeError = primer.join(' | ');
                }
            }else if (typeof error.error === 'string'){
                mensajeError = error.error;
            }

            notify.error(mensajeError);
            return throwError(() => error);
        })
    );
}