import { Injectable } from '@angular/core';

/**
 * Servicio utilitario para interactuar de forma segura y tipada con localStorage.
 * Soporta serialización automática a JSON, manejo de excepciones y verificación de entorno de ejecución.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly esNavegador: boolean = typeof window !== 'undefined' && !!window.localStorage;

  /**
   * Guarda un valor en localStorage.
   * Si el valor es un objeto o array, se serializa a JSON automáticamente.
   */
  set<T>(key: string, value: T): boolean {
    if (!this.esNavegador) return false;
    try {
      const serializado = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serializado);
      return true;
    } catch (error) {
      console.error(`[StorageService] Error guardando la clave "${key}":`, error);
      return false;
    }
  }

  /**
   * Obtiene un valor de localStorage y lo deserializa si es JSON válido.
   */
  get<T>(key: string): T | null {
    if (!this.esNavegador) return null;
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;

      try {
        return JSON.parse(item) as T;
      } catch {
        // Si no es JSON (ej. un string plano o token), retornarlo directamente
        return item as unknown as T;
      }
    } catch (error) {
      console.error(`[StorageService] Error leyendo la clave "${key}":`, error);
      return null;
    }
  }

  /**
   * Elimina un elemento de localStorage por su clave.
   */
  remove(key: string): void {
    if (!this.esNavegador) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[StorageService] Error eliminando la clave "${key}":`, error);
    }
  }

  /**
   * Verifica si existe una clave en localStorage.
   */
  has(key: string): boolean {
    if (!this.esNavegador) return false;
    return localStorage.getItem(key) !== null;
  }

  /**
   * Limpia todos los registros almacenados en localStorage correspondientes al sistema.
   */
  clear(): void {
    if (!this.esNavegador) return;
    try {
      localStorage.clear();
    } catch (error) {
      console.error('[StorageService] Error limpiando localStorage:', error);
    }
  }
}
