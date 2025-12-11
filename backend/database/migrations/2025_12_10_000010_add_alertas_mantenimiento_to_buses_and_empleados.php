<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('buses', function (Blueprint $table) {
            if (!Schema::hasColumn('buses', 'kilometraje_actual')) {
                $table->integer('kilometraje_actual')->default(0)->after('kilometraje_original');
            }
            if (!Schema::hasColumn('buses', 'kilometraje_ultimo_cambio_aceite')) {
                $table->integer('kilometraje_ultimo_cambio_aceite')->nullable()->after('kilometraje_actual');
            }
            if (!Schema::hasColumn('buses', 'tipo_aceite_motor')) {
                $table->string('tipo_aceite_motor')->default('convencional')->after('kilometraje_ultimo_cambio_aceite');
            }
            if (!Schema::hasColumn('buses', 'fecha_ultima_revision_tecnica')) {
                $table->date('fecha_ultima_revision_tecnica')->nullable()->after('tipo_aceite_motor');
            }
        });

        Schema::table('empleados', function (Blueprint $table) {
            if (!Schema::hasColumn('empleados', 'tipo_contrato')) {
                $table->string('tipo_contrato')->default('indefinido')->after('salario_base');
            }
            if (!Schema::hasColumn('empleados', 'fecha_fin_contrato')) {
                $table->date('fecha_fin_contrato')->nullable()->after('tipo_contrato');
            }
        });
    }

    public function down(): void
    {
        Schema::table('buses', function (Blueprint $table) {
            if (Schema::hasColumn('buses', 'fecha_ultima_revision_tecnica')) {
                $table->dropColumn('fecha_ultima_revision_tecnica');
            }
            if (Schema::hasColumn('buses', 'tipo_aceite_motor')) {
                $table->dropColumn('tipo_aceite_motor');
            }
            if (Schema::hasColumn('buses', 'kilometraje_ultimo_cambio_aceite')) {
                $table->dropColumn('kilometraje_ultimo_cambio_aceite');
            }
            if (Schema::hasColumn('buses', 'kilometraje_actual')) {
                $table->dropColumn('kilometraje_actual');
            }
        });

        Schema::table('empleados', function (Blueprint $table) {
            if (Schema::hasColumn('empleados', 'fecha_fin_contrato')) {
                $table->dropColumn('fecha_fin_contrato');
            }
            if (Schema::hasColumn('empleados', 'tipo_contrato')) {
                $table->dropColumn('tipo_contrato');
            }
        });
    }
};