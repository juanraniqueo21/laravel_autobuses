<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class RutValidation implements Rule
{
    /**
     * Determinar si la validación pasa.
     *
     * @param  string  $attribute
     * @param  mixed  $value (debe ser el RUT completo: "21526409-2")
     * @return bool
     */
    public function passes($attribute, $value)
    {
        // Limpiar el RUT: quitar puntos, espacios
        $rut = strtoupper(str_replace(['.', ' ', '-'], '', $value));
        
        // Verificar que tenga al menos 2 caracteres (número + verificador)
        if (strlen($rut) < 2) {
            return false;
        }
        
        // Separar número y dígito verificador
        $numero = substr($rut, 0, -1);
        $dvIngresado = substr($rut, -1);
        
        // Verificar que el número sea numérico
        if (!is_numeric($numero)) {
            return false;
        }
        
        // Verificar que el dígito verificador sea 0-9 o K
        if (!preg_match('/^[0-9K]$/', $dvIngresado)) {
            return false;
        }
        
        // Calcular dígito verificador correcto
        $dvCalculado = $this->calcularDV($numero);
        
        // Comparar dígito ingresado con el calculado
        return $dvIngresado === $dvCalculado;
    }
    
    /**
     * Calcular dígito verificador usando algoritmo módulo 11
     *
     * @param  string  $numero
     * @return string
     */
    private function calcularDV($numero)
    {
        $suma = 0;
        $multiplo = 2;
        
        // Recorrer el número de derecha a izquierda
        for ($i = strlen($numero) - 1; $i >= 0; $i--) {
            $suma += $numero[$i] * $multiplo;
            $multiplo = $multiplo < 7 ? $multiplo + 1 : 2;
        }
        
        $resto = $suma % 11;
        $dv = 11 - $resto;
        
        // Casos especiales
        if ($dv == 11) {
            return '0';
        } elseif ($dv == 10) {
            return 'K';
        } else {
            return (string)$dv;
        }
    }

    /**
     * Obtener el mensaje de error de validación.
     *
     * @return string
     */
    public function message()
    {
        return 'El RUT ingresado no es válido. Formato: 12345678-9 o 12345678-K';
    }
}