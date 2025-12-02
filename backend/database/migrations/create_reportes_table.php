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
        Schema::create('reportes', function (Blueprint $table) {
            $table->id();
            
            // Relación con empleado que crea el reporte
            $table->foreignId('empleado_id')->constrained('empleados')->onDelete('cascade');
            
            // Tipo de reporte
            $table->enum('tipo', [
                'ausencia_enfermedad',
                'ausencia_personal',
                'incidente_ruta',
                'problema_mecanico',
                'accidente_transito',
                'queja_pasajero',
                'observacion_seguridad',
                'otro'
            ]);
            
            // Estado del reporte
            $table->enum('estado', ['pendiente', 'aprobado', 'rechazado'])->default('pendiente');
            
            // Fechas del reporte
            $table->date('fecha_incidente');
            $table->time('hora_incidente')->nullable();
            
            // Información del reporte
            $table->string('titulo', 200);
            $table->text('descripcion');
            
            // Información adicional según tipo
            $table->string('ubicacion', 200)->nullable(); // Para incidentes/accidentes
            $table->foreignId('bus_id')->nullable()->constrained('buses')->onDelete('set null'); // Bus relacionado
            $table->foreignId('ruta_id')->nullable()->constrained('rutas')->onDelete('set null'); // Ruta relacionada
            
            // Gravedad del reporte (solo para algunos tipos)
            $table->enum('gravedad', ['baja', 'media', 'alta', 'critica'])->nullable();
            
            // Archivo adjunto
            $table->string('ruta_documento')->nullable();
            $table->string('nombre_documento')->nullable();
            
            // Aprobación/Rechazo
            $table->foreignId('revisado_por')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('fecha_revision')->nullable();
            $table->text('observaciones_revision')->nullable();
            
            $table->timestamps();
            
            // Índices para optimizar consultas
            $table->index('empleado_id');
            $table->index('tipo');
            $table->index('estado');
            $table->index('fecha_incidente');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reportes');
    }
};
