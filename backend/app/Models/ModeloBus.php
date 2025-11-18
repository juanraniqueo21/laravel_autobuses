<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModeloBus extends Model
{
    protected $table = 'modelos_bus';
    public $timestamps = true;

    protected $fillable = [
        'marca_id',
        'nombre',
        'tipo',
        'activo',
    ];

    protected $casts = [
        'marca_id' => 'integer',
        'activo' => 'boolean',
    ];

    // ============================================
    // RELACIONES
    // ============================================

    /**
     * Un modelo pertenece a una marca
     */
    public function marca(): BelongsTo
    {
        return $this->belongsTo(MarcaBus::class, 'marca_id');
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Scope para obtener solo modelos activos
     */
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Scope para obtener modelos por tipo
     */
    public function scopePorTipo($query, $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    /**
     * Scope para obtener modelos de una marca específica
     */
    public function scopePorMarca($query, $marcaId)
    {
        return $query->where('marca_id', $marcaId);
    }
}