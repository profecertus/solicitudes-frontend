import { HttpInterceptorFn } from "@angular/common/http";
import { finalize } from "rxjs";
import { inject } from "@angular/core";
import { LoadingServices } from "../services/loading.service";

export const loadingInterceptors:HttpInterceptorFn = (req, next) => {
    const loader = inject(LoadingServices);
    loader.mostrar();
    return next(req).pipe(finalize(() => loader.ocultar()))
}