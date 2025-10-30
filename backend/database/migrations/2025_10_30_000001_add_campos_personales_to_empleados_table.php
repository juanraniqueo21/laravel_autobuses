<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            $table->string('ciudad', 100)->nullable()->after('numero_seguro_cesantia');
            $table->text('direccion')->nullable()->after('ciudad');
            $table->string('telefono_personal', 12)->nullable()->after('direccion');
            $table->date('fecha_nacimiento')->nullable()->after('telefono_personal');
            $table->enum('genero', ['masculino', 'femenino', 'otro'])->nullable()->after('fecha_nacimiento');
            $table->string('contacto_emergencia_nombre', 100)->nullable()->after('genero');
            $table->string('contacto_emergencia_telefono', 12)->nullable()->after('contacto_emergencia_nombre');
            $table->string('contacto_emergencia_relacion', 50)->nullable()->after('contacto_emergencia_telefono');
            $table->string('banco', 100)->nullable()->after('contacto_emergencia_relacion');
            $table->string('tipo_cuenta', 50)->nullable()->after('banco');
            $table->string('numero_cuenta', 50)->nullable()->after('tipo_cuenta');
        });
    }

    public function down(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            $table->dropColumn([
                'ciudad',
                'direccion',
                'telefono_personal',
                'fecha_nacimiento',
                'genero',
                'contacto_emergencia_nombre',
                'contacto_emergencia_telefono',
                'contacto_emergencia_relacion',
                'banco',
                'tipo_cuenta',
                'numero_cuenta',
            ]);
        });
    }
};