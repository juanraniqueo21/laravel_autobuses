<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarcaBus extends Model
{
    protected $table = 'marcas_bus';
    public $timestamps = true;

    protected $fillable = [
        'nombre',
        'tipo',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    // ============================================
    // RELACIONES
    // ============================================

    /**
     * Una marca tiene muchos modelos
     */
    public function modelos(): HasMany
    {
        return $this->hasMany(ModeloBus::class, 'marca_id');
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Scope para obtener solo marcas activas
     */
    public function scopeActivas($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Scope para obtener marcas por tipo
     */
    public function scopePorTipo($query, $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    /**
     * Scope para obtener marcas de buses activas
     */
    public function scopeBuses($query)
    {
        return $query->where('tipo', 'bus')->where('activo', true);
    }

    /**
     * Scope para obtener marcas de motores activas
     */
    public function scopeMotores($query)
    {
        return $query->where('tipo', 'motor')->where('activo', true);
    }

    /**
     * Scope para obtener marcas de chasis activas
     */
    public function scopeChasis($query)
    {
        return $query->where('tipo', 'chasis')->where('activo', true);
    }

    /**
     * Scope para obtener marcas de carrocerías activas
     */
    public function scopeCarrocerias($query)
    {
        return $query->where('tipo', 'carroceria')->where('activo', true);
    }
}