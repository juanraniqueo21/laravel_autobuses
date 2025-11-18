<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('buses', function (Blueprint $table) {
            // ============================================
            // ELIMINAR CAMPOS OBSOLETOS
            // ============================================
            $table->dropColumn([
                'kilometraje_actual',  // Se registra en viajes
                'color',               // No es crítico
            ]);
            
            // ============================================
            // AGREGAR NUEVOS CAMPOS - CARACTERÍSTICAS
            // ============================================
            $table->enum('tipo_bus', ['simple', 'doble_piso'])
                  ->default('simple')
                  ->after('capacidad_pasajeros');
                  
            $table->enum('cantidad_ejes', ['2', '3', '4'])
                  ->default('2')
                  ->after('tipo_bus');
            
            // ============================================
            // AGREGAR NUEVOS CAMPOS - MOTOR
            // ============================================
            $table->string('marca_motor', 50)
                  ->nullable()
                  ->after('tipo_combustible');
                  
            $table->string('modelo_motor', 50)
                  ->nullable()
                  ->after('marca_motor');
                  
            $table->enum('ubicacion_motor', ['delantero', 'trasero', 'central'])
                  ->default('trasero')
                  ->after('modelo_motor');
            
            // numero_motor ya existe, se mantiene
            
            // ============================================
            // AGREGAR NUEVOS CAMPOS - CHASIS
            // ============================================
            $table->string('marca_chasis', 50)
                  ->nullable()
                  ->after('numero_motor');
                  
            $table->string('modelo_chasis', 50)
                  ->nullable()
                  ->after('marca_chasis');
            
            // numero_chasis ya existe, se mantiene
            
            // ============================================
            // AGREGAR NUEVOS CAMPOS - CARROCERÍA
            // ============================================
            $table->string('marca_carroceria', 50)
                  ->nullable()
                  ->after('numero_chasis');
                  
            $table->string('modelo_carroceria', 50)
                  ->nullable()
                  ->after('marca_carroceria');
            
            // ============================================
            // AGREGAR CAMPOS - MANTENIMIENTO
            // ============================================
            $table->integer('proximo_mantenimiento_km')
                  ->nullable()
                  ->after('kilometraje_original')
                  ->comment('Cada cuántos km hacer mantenimiento (ej: 10000)');
                  
            $table->date('fecha_ultimo_mantenimiento')
                  ->nullable()
                  ->after('proximo_mantenimiento_km');
                  
            $table->date('fecha_proximo_mantenimiento')
                  ->nullable()
                  ->after('fecha_ultimo_mantenimiento')
                  ->comment('Para alertas en dashboard');
            
            // ============================================
            // ÍNDICES NUEVOS
            // ============================================
            $table->index('tipo_bus');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buses', function (Blueprint $table) {
            // Restaurar campos eliminados
            $table->integer('kilometraje_actual')->default(0);
            $table->string('color', 50)->nullable();
            
            // Eliminar campos agregados
            $table->dropColumn([
                'tipo_bus',
                'cantidad_ejes',
                'marca_motor',
                'modelo_motor',
                'ubicacion_motor',
                'marca_chasis',
                'modelo_chasis',
                'marca_carroceria',
                'modelo_carroceria',
                'proximo_mantenimiento_km',
                'fecha_ultimo_mantenimiento',
                'fecha_proximo_mantenimiento',
            ]);
            
            // Eliminar índices
            $table->dropIndex(['tipo_bus']);
        });
    }
};
