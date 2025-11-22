<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ruta extends Model
{
    protected $table = 'rutas';
    public $timestamps = true;

    protected $fillable = [
        'nombre_ruta',
        'codigo_ruta',
        'origen',           // ← Cambió de punto_salida
        'destino',          // ← Cambió de punto_destino
        'distancia_km',
        'tiempo_estimado_minutos',
        'descripcion',
        'estado',
    ];

    protected $casts = [
        'distancia_km' => 'decimal:2',
        'tiempo_estimado_minutos' => 'integer',
    ];

    // ============================================
    // RELACIONES
    // ============================================

    /**
     * Paradas de esta ruta (ordenadas)
     */
    public function paradas(): HasMany
    {
        return $this->hasMany(RutaParada::class)->orderBy('orden');
    }

    
    /**
     * Viajes que usan esta ruta
     */
    public function viajes(): HasMany
    {
        return $this->hasMany(Viaje::class);
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Scope para rutas activas
     */
    public function scopeActivas($query)
    {
        return $query->where('estado', 'activa');
    }

    /**
     * Scope para buscar por código
     */
    public function scopePorCodigo($query, $codigo)
    {
        return $query->where('codigo_ruta', $codigo);
    }

    // ============================================
    // MÉTODOS ÚTILES
    // ============================================

    /**
     * Obtener parada de origen
     */
    public function getParadaOrigen()
    {
        return $this->paradas()->where('es_origen', true)->first();
    }

    /**
     * Obtener parada de destino
     */
    public function getParadaDestino()
    {
        return $this->paradas()->where('es_destino', true)->first();
    }

    /**
     * Calcular distancia total de todas las paradas
     */
    public function calcularDistanciaTotal()
    {
        return $this->paradas()->sum('distancia_desde_anterior_km');
    }

    /**
     * Calcular tiempo total de todas las paradas
     */
    public function calcularTiempoTotal()
    {
        return $this->paradas()->sum('tiempo_desde_anterior_min');
    }


    /**
     * Verificar si la ruta está completa (tiene origen, destino y al menos 2 paradas)
     */
    public function estaCompleta(): bool
    {
        $tieneOrigen = $this->paradas()->where('es_origen', true)->exists();
        $tieneDestino = $this->paradas()->where('es_destino', true)->exists();
        $tieneParadas = $this->paradas()->count() >= 2;

        return $tieneOrigen && $tieneDestino && $tieneParadas;
    }
}