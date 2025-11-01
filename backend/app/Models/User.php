<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'users';
    
    protected $fillable = [
        'nombre',
        'apellido',
        'email',
        'password',
        'rut',
        'rut_verificador',
        'telefono',
        'estado',
        'rol_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // ============================================
    // RELACIONES
    // ============================================
    
    /**
     * Relación: User pertenece a un Rol
     */
    public function rol()
    {
        return $this->belongsTo(Rol::class, 'rol_id');
    }

    // ============================================
    // MUTADORES Y ACCEADORES
    // ============================================

    /**
     * Formatear teléfono para visualización
     * Entrada: 976046231
     * Salida: +56 9 7604 6231
     */
    public function getPhoneFormattedAttribute()
    {
        if (!$this->telefono) {
            return null;
        }

        $phone = preg_replace('/\D/', '', $this->telefono); // Solo dígitos
        
        if (strlen($phone) === 9 && substr($phone, 0, 1) === '9') {
            return '+56 ' . substr($phone, 0, 1) . ' ' . substr($phone, 1, 4) . ' ' . substr($phone, 5);
        }
        
        return $this->telefono;
    }

    /**
     * Obtener nombre completo
     */
    public function getNombreCompletoAttribute()
    {
        return $this->nombre . ' ' . $this->apellido;
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Scope: Filtrar por estado
     */
    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    /**
     * Scope: Filtrar por rol
     */
    public function scopeByRol($query, $rolId)
    {
        return $query->where('rol_id', $rolId);
    }
}