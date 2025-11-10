<?php

namespace App\Helpers;

class RutHelper
{
    /**
     * Formatear RUT al formato estándar: 12345678-9
     * Sin puntos, solo con guión
     *
     * @param  string  $rut
     * @return string
     */
    public static function formatear($rut)
    {
        // Limpiar: quitar todo excepto números y K
        $rut = strtoupper(preg_replace('/[^0-9kK]/', '', $rut));
        
        if (strlen($rut) < 2) {
            return $rut;
        }
        
        // Separar número y dígito verificador
        $numero = substr($rut, 0, -1);
        $dv = substr($rut, -1);
        
        // Retornar formato: 12345678-9
        return $numero . '-' . $dv;
    }

    /**
     * Separar RUT en número y dígito verificador
     * 
     * @param  string  $rut (puede venir como "21526409-2" o "215264092")
     * @return array ['numero' => '21526409', 'dv' => '2']
     */
    public static function separar($rut)
    {
        // Limpiar
        $rut = strtoupper(preg_replace('/[^0-9kK]/', '', $rut));
        
        if (strlen($rut) < 2) {
            return ['numero' => '', 'dv' => ''];
        }
        
        return [
            'numero' => substr($rut, 0, -1),
            'dv' => substr($rut, -1)
        ];
    }

    /**
     * Validar que el dígito verificador solo sea 0-9 o K
     * 
     * @param  string  $dv
     * @return bool
     */
    public static function validarFormatoDV($dv)
    {
        return preg_match('/^[0-9kK]$/', $dv) === 1;
    }

    /**
     * Limpiar RUT (quitar puntos, guiones, espacios)
     * 
     * @param  string  $rut
     * @return string
     */
    public static function limpiar($rut)
    {
        return strtoupper(preg_replace('/[^0-9kK]/', '', $rut));
    }
}