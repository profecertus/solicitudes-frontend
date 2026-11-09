import { Injectable } from '@angular/core';

/**
 * Servicio para ofuscar (hashear) y deofuscar los identificadores numéricos de las solicitudes.
 * Evita exponer IDs secuenciales en la barra de direcciones URL (previniendo enumeración directa / IDOR)
 * mediante un algoritmo determinista reversible con salt, clave XOR y suma de verificación.
 */
@Injectable({
  providedIn: 'root'
})
export class HashService {
  private static readonly PRIME = 7919;
  private static readonly OFFSET = 104729;
  private static readonly XOR_KEY = 0x5F3759DF;

  /**
   * Transforma un ID entero positivo en un token hexadecimal ofuscado (Hash).
   * Ejemplo: 6 -> '5f350b6cc1'
   */
  encode(id: number | null | undefined): string {
    if (!id || id <= 0) return '';

    // Ofuscación del entero a 32 bits sin signo con sal y desplazamiento
    const obfuscated = ((id * HashService.PRIME + HashService.OFFSET) ^ HashService.XOR_KEY) >>> 0;

    // Checksum de verificación de 2 dígitos hex para validar integridad
    const check = ((id * 31 + 7) & 0xFF).toString(16).padStart(2, '0');

    // Retorna string hexadecimal de longitud fija (8 caracteres de ofuscado + 2 de checksum)
    return obfuscated.toString(16).padStart(8, '0') + check;
  }

  /**
   * Decodifica un token hash de vuelta a su ID entero original.
   * Soporta compatibilidad con números enteros planos (ej. si el usuario ingresa manualmente /solicitudes/6).
   */
  decode(token: string | null | undefined): number | null {
    if (!token) return null;
    const clean = token.trim();

    // 1. Compatibilidad hacia atrás: Si ya es un número entero puro
    if (/^\d+$/.test(clean)) {
      const num = parseInt(clean, 10);
      return num > 0 ? num : null;
    }

    // 2. Validación de formato de hash (10 dígitos hexadecimales)
    if (!/^[0-9a-fA-F]{10}$/.test(clean)) {
      return null;
    }

    const hexVal = clean.substring(0, 8);
    const checkVal = clean.substring(8).toLowerCase();

    const obfuscated = parseInt(hexVal, 16);
    const raw = (obfuscated ^ HashService.XOR_KEY) >>> 0;

    if (raw < HashService.OFFSET) return null;

    const id = (raw - HashService.OFFSET) / HashService.PRIME;
    if (!Number.isInteger(id) || id <= 0) return null;

    // Validar checksum de integridad
    const expectedCheck = ((id * 31 + 7) & 0xFF).toString(16).padStart(2, '0').toLowerCase();
    return expectedCheck === checkVal ? id : null;
  }
}
