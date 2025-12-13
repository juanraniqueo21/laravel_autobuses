<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class ReportHistory extends Model
{
    protected $fillable = [
        'tipo',
        'mes',
        'anio',
        'filtros',
        'archivo',
        'user_id',
    ];

    protected $casts = [
        'filtros' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
