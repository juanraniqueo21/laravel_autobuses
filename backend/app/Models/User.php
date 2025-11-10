<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
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

    protected $appends = [
        'rut_completo' // Agregar RUT formateado automáticamente
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // ============================================
    // JWT METHODS (REQUERIDOS)
    // ============================================
    
    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     */
    public function getJWTCustomClaims()
    {
        return [];
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
     * Formatear RUT completo: 21526409-2
     */
    public function getRutCompletoAttribute()
    {
        if (!$this->rut || !$this->rut_verificador) {
            return null;
        }
        
        return $this->rut . '-' . strtoupper($this->rut_verificador);
    }

    /**
     * Formatear teléfono para visualización
     */
    public function getPhoneFormattedAttribute()
    {
        if (!$this->telefono) {
            return null;
        }

        $phone = preg_replace('/\D/', '', $this->telefono);
        
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