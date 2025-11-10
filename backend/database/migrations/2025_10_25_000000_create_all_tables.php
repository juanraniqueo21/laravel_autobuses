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
        // ============================================
        // 1. TABLA: ROLES
        // ============================================
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50)->unique();
            $table->string('descripcion', 255)->nullable();
            $table->timestamps();
        });

        // ============================================
        // 2. TABLA: USERS
        // ============================================
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('apellido');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('rut', 12)->unique(); // Formato: 12.345.678
            $table->char('rut_verificador', 1); // Dígito verificador (0-9 o K)
            $table->enum('estado', ['activo', 'inactivo', 'suspendido'])->default('activo');
            $table->unsignedBigInteger('rol_id');
            $table->timestamps();
            
            // Relaciones
            $table->foreign('rol_id')->references('id')->on('roles');
            
            // Índices
            $table->index('rut');
            $table->index('email');
            $table->index('rol_id');
        });

        // ============================================
        // 3. TABLA: AFP_LIST
        // ============================================
        Schema::create('afp_list', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100)->unique(); // Habitat, Provida, etc
            $table->decimal('porcentaje_descuento', 5, 2)->default(10.0); // 10%
        });

        // ============================================
        // 4. TABLA: EMPLEADOS
        // ============================================
        Schema::create('empleados', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->string('numero_empleado', 10)->unique();
            $table->date('fecha_contratacion');
            $table->date('fecha_termino')->nullable();
            $table->enum('tipo_contrato', ['indefinido', 'plazo_fijo', 'practicante']);
            $table->bigInteger('salario_base'); // En CLP, entero (sin decimales)
            $table->unsignedBigInteger('afp_id')->nullable();
            $table->boolean('fonasa')->default(true); // true=Fonasa, false=Isapre
            $table->string('isapre_nombre', 100)->nullable();
            $table->string('numero_seguro_cesantia', 20)->nullable();
            $table->enum('estado', ['activo', 'licencia', 'suspendido', 'terminado'])->default('activo');
            $table->timestamps();
            
            // Relaciones
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('afp_id')->references('id')->on('afp_list');
            
            // Índices
            $table->index('user_id');
            $table->index('estado');
        });

        // ============================================
        // 5. TABLA: DOCUMENTOS_EMPLEADOS
        // ============================================
        Schema::create('documentos_empleados', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empleado_id');
            $table->enum('tipo_documento', ['fonasa', 'afp_carnet', 'licencia_conducir', 'certificado_medico', 'contrato', 'otro']);
            $table->string('ruta_archivo', 500);
            $table->string('nombre_archivo', 255);
            $table->date('fecha_vencimiento')->nullable();
            $table->boolean('vigente')->default(true);
            $table->timestamps();
            
            // Relaciones
            $table->foreign('empleado_id')->references('id')->on('empleados')->onDelete('cascade');
        });

        // ============================================
        // 6. TABLA: CONDUCTORES
        // ============================================
        Schema::create('conductores', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empleado_id')->unique();
            $table->string('numero_licencia', 20)->unique();
            $table->enum('clase_licencia', ['A', 'B', 'C', 'D', 'E']);
            $table->date('fecha_vencimiento_licencia');
            $table->integer('puntos_licencia')->default(0);
            $table->enum('estado', ['activo', 'baja_medica', 'suspendido', 'inactivo'])->default('activo');
            $table->integer('anios_experiencia')->default(0);
            $table->date('fecha_primera_licencia')->nullable();
            $table->string('estado_licencia', 50)->default('vigente');
            $table->text('observaciones_licencia')->nullable();
            $table->integer('cantidad_infracciones')->default(0);
            $table->integer('cantidad_accidentes')->default(0);
            $table->text('historial_sanciones')->nullable();
            $table->date('fecha_ultima_revision_medica')->nullable();
            $table->boolean('apto_conducir')->default(true);
            $table->boolean('certificado_rcp')->default(false);
            $table->date('vencimiento_rcp')->nullable();
            $table->boolean('certificado_defensa')->default(false);
            $table->date('vencimiento_defensa')->nullable();
            $table->timestamps();
            
            // Relaciones
            $table->foreign('empleado_id')->references('id')->on('empleados')->onDelete('cascade');
            
            // Índices
            $table->index('empleado_id');
        });

        // ============================================
        // 7. TABLA: ASISTENTES
        // ============================================
        Schema::create('asistentes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empleado_id')->unique();
            $table->date('fecha_inicio');
            $table->enum('estado', ['activo', 'inactivo', 'suspendido'])->default('activo');
            $table->timestamps();
            
            // Relaciones
            $table->foreign('empleado_id')->references('id')->on('empleados')->onDelete('cascade');
        });

        // ============================================
        // 8. TABLA: BUSES (VERSIÓN COMPLETA)
        // ============================================
        Schema::create('buses', function (Blueprint $table) {
            $table->id();
            
            // Identificación del bus
            $table->string('patente', 6)->unique(); // Formato: SASA12
            $table->char('patente_verificador', 1); // Dígito verificador
            
            // Información básica
            $table->string('marca', 50);
            $table->string('modelo', 50);
            $table->integer('anio');
            $table->string('tipo_combustible', 50)->nullable(); // diesel, gas, electrico
            $table->string('color', 50)->nullable();
            
            // Números de serie
            $table->string('numero_serie', 50)->nullable();
            $table->string('numero_motor', 50)->nullable();
            $table->string('numero_chasis', 50)->nullable();
            
            // Capacidad
            $table->integer('capacidad_pasajeros');
            
            // Fechas
            $table->date('fecha_adquisicion')->nullable();
            
            // Estado operativo
            $table->enum('estado', ['operativo', 'mantenimiento', 'desmantelado'])->default('operativo');
            
            // Revisión técnica
            $table->date('proxima_revision_tecnica')->nullable();
            $table->date('ultima_revision_tecnica')->nullable();
            $table->string('documento_revision_tecnica', 500)->nullable();
            
            // SOAP (Seguro Obligatorio de Accidentes Personales)
            $table->date('vencimiento_soap')->nullable();
            $table->string('numero_soap', 50)->nullable();
            
            // Seguro y póliza
            $table->string('compania_seguro', 100)->nullable();
            $table->string('numero_poliza', 50)->nullable();
            $table->enum('tipo_cobertura_adicional', ['ninguna', 'terceros', 'full'])->default('ninguna')->nullable();
            $table->date('vencimiento_poliza')->nullable();
            
            // Permisos
            $table->string('numero_permiso_circulacion', 50)->nullable();
            
            // Observaciones
            $table->text('observaciones')->nullable();
            
            // Kilometraje
            $table->integer('kilometraje_original')->default(0);
            $table->integer('kilometraje_actual')->default(0);
            
            $table->timestamps();
            
            // Índices
            $table->index('patente');
            $table->index('estado');
        });

        // ============================================
        // 9. TABLA: MANTENIMIENTOS
        // ============================================
        Schema::create('mantenimientos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bus_id');
            $table->unsignedBigInteger('mecanico_id');
            $table->enum('tipo_mantenimiento', ['preventivo', 'correctivo', 'revision']);
            $table->text('descripcion');
            $table->date('fecha_inicio');
            $table->date('fecha_termino')->nullable();
            $table->bigInteger('costo_total')->nullable(); // En CLP, entero
            $table->enum('estado', ['en_proceso', 'completado', 'cancelado'])->default('en_proceso');
            $table->json('repuestos_utilizados')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();
            
            // Relaciones
            $table->foreign('bus_id')->references('id')->on('buses')->onDelete('cascade');
            $table->foreign('mecanico_id')->references('id')->on('empleados');
            
            // Índices
            $table->index('bus_id');
            $table->index('fecha_inicio');
        });

        // ============================================
        // 10. TABLA: RUTAS
        // ============================================
        Schema::create('rutas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_ruta', 100);
            $table->string('codigo_ruta', 20)->unique();
            $table->string('punto_salida', 255);
            $table->string('punto_destino', 255);
            $table->decimal('distancia_km', 8, 2)->nullable();
            $table->integer('tiempo_estimado_minutos')->nullable();
            $table->text('descripcion')->nullable();
            $table->json('paradas')->nullable(); // JSON con paradas intermedias
            $table->enum('estado', ['activa', 'inactiva', 'en_revision'])->default('activa');
            $table->timestamps();
        });

        // ============================================
        // 11. TABLA: ASIGNACIONES_TURNO
        // ============================================
        Schema::create('asignaciones_turno', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bus_id');
            $table->unsignedBigInteger('conductor_id');
            $table->unsignedBigInteger('asistente_id')->nullable();
            $table->unsignedBigInteger('ruta_id');
            $table->date('fecha_turno');
            $table->time('hora_inicio');
            $table->time('hora_termino');
            $table->enum('estado', ['programado', 'en_curso', 'completado', 'cancelado'])->default('programado');
            $table->text('observaciones')->nullable();
            $table->timestamps();
            
            // Relaciones
            $table->foreign('bus_id')->references('id')->on('buses');
            $table->foreign('conductor_id')->references('id')->on('conductores');
            $table->foreign('asistente_id')->references('id')->on('asistentes');
            $table->foreign('ruta_id')->references('id')->on('rutas');
            
            // Índices
            $table->index('fecha_turno');
            $table->index('conductor_id');
            $table->index('bus_id');
        });

        // ============================================
        // 12. TABLA: REPORTES_OPERATIVIDAD
        // ============================================
        Schema::create('reportes_operatividad', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('asignacion_turno_id');
            $table->unsignedBigInteger('conductor_id');
            $table->enum('estado_bus_inicial', ['excelente', 'bueno', 'regular', 'malo']);
            $table->enum('estado_bus_final', ['excelente', 'bueno', 'regular', 'malo']);
            $table->text('incidentes_reportados')->nullable();
            $table->integer('kilometraje_inicial')->nullable();
            $table->integer('kilometraje_final')->nullable();
            $table->integer('pasajeros_transportados')->nullable();
            $table->timestamp('tiempo_inicio')->nullable();
            $table->timestamp('tiempo_termino')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();
            
            // Relaciones
            $table->foreign('asignacion_turno_id')->references('id')->on('asignaciones_turno');
            $table->foreign('conductor_id')->references('id')->on('conductores');
        });

        // ============================================
        // 13. TABLA: LIQUIDACIONES (NÓMINA)
        // ============================================
        Schema::create('liquidaciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empleado_id');
            $table->date('periodo_desde');
            $table->date('periodo_hasta');
            $table->bigInteger('sueldo_base'); // En CLP, entero
            $table->bigInteger('descuento_afp')->default(0); // En CLP, entero
            $table->bigInteger('descuento_isapre')->default(0); // En CLP, entero
            $table->bigInteger('descuento_impuesto_renta')->default(0); // En CLP, entero
            $table->bigInteger('descuento_seguro_desempleo')->default(0); // En CLP, entero (0.6%)
            $table->bigInteger('otros_descuentos')->default(0); // En CLP, entero
            $table->bigInteger('bonificaciones')->default(0); // En CLP, entero
            $table->bigInteger('horas_extras_valor')->default(0); // En CLP, entero
            $table->bigInteger('sueldo_liquido'); // En CLP, entero (lo que se paga)
            $table->enum('estado', ['borrador', 'procesada', 'pagada', 'cancelada'])->default('borrador');
            $table->date('fecha_pago')->nullable();
            $table->string('numero_comprobante', 20)->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();
            
            // Relaciones
            $table->foreign('empleado_id')->references('id')->on('empleados');
            
            // Índices
            $table->index('empleado_id');
            $table->index(['periodo_desde', 'periodo_hasta']);
        });

        // ============================================
        // 14. TABLA: ASISTENCIAS
        // ============================================
        Schema::create('asistencias', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empleado_id');
            $table->date('fecha');
            $table->time('hora_entrada')->nullable();
            $table->time('hora_salida')->nullable();
            $table->enum('estado', ['presente', 'ausente', 'permiso', 'licencia', 'otro'])->default('presente');
            $table->text('observaciones')->nullable();
            $table->timestamps();
            
            // Relaciones
            $table->foreign('empleado_id')->references('id')->on('empleados');
            
            // Índices y constraints
            $table->unique(['empleado_id', 'fecha']);
            $table->index(['empleado_id', 'fecha']);
        });

        // ============================================
        // 15. TABLA: PERMISOS_VACACIONES
        // ============================================
        Schema::create('permisos_vacaciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empleado_id');
            $table->enum('tipo', ['permiso', 'vacaciones', 'licencia_medica', 'licencia_maternidad']);
            $table->date('fecha_inicio');
            $table->date('fecha_termino');
            $table->integer('dias_totales');
            $table->enum('estado', ['solicitado', 'aprobado', 'rechazado', 'completado'])->default('solicitado');
            $table->text('motivo')->nullable();
            $table->unsignedBigInteger('aprobado_por')->nullable();
            $table->timestamp('fecha_respuesta')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();
            
            // Relaciones
            $table->foreign('empleado_id')->references('id')->on('empleados');
            $table->foreign('aprobado_por')->references('id')->on('users');
        });

        // ============================================
        // 16. TABLA: AUDITORIA
        // ============================================
        Schema::create('auditoria', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('usuario_id');
            $table->string('accion', 100); // INSERT, UPDATE, DELETE
            $table->string('tabla_afectada', 50);
            $table->unsignedBigInteger('registro_id')->nullable();
            $table->json('valores_anterior')->nullable();
            $table->json('valores_nuevo')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
            
            // Relaciones
            $table->foreign('usuario_id')->references('id')->on('users');
            
            // Índices
            $table->index('usuario_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Eliminar en orden inverso por las relaciones
        Schema::dropIfExists('auditoria');
        Schema::dropIfExists('permisos_vacaciones');
        Schema::dropIfExists('asistencias');
        Schema::dropIfExists('liquidaciones');
        Schema::dropIfExists('reportes_operatividad');
        Schema::dropIfExists('asignaciones_turno');
        Schema::dropIfExists('rutas');
        Schema::dropIfExists('mantenimientos');
        Schema::dropIfExists('buses');
        Schema::dropIfExists('asistentes');
        Schema::dropIfExists('conductores');
        Schema::dropIfExists('documentos_empleados');
        Schema::dropIfExists('empleados');
        Schema::dropIfExists('afp_list');
        Schema::dropIfExists('users');
        Schema::dropIfExists('roles');
    }
};