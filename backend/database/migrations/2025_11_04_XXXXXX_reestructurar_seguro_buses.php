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
            // 1. Renombrar vencimiento_seguro a vencimiento_soap
            $table->renameColumn('vencimiento_seguro', 'vencimiento_soap');
            
            // 2. Eliminar tipo_seguro (ya no se usa)
            $table->dropColumn('tipo_seguro');
            
            // 3. Agregar nuevos campos
            $table->string('numero_poliza', 50)->nullable()->after('numero_soap');
            $table->enum('tipo_cobertura_adicional', ['ninguna', 'terceros', 'full'])
                  ->default('ninguna')
                  ->after('compania_seguro');
            $table->date('vencimiento_poliza')->nullable()->after('tipo_cobertura_adicional');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buses', function (Blueprint $table) {
            // Revertir cambios
            $table->renameColumn('vencimiento_soap', 'vencimiento_seguro');
            $table->enum('tipo_seguro', ['SOAP', 'obligatorio', 'full', 'terceros'])->default('SOAP');
            $table->dropColumn(['numero_poliza', 'tipo_cobertura_adicional', 'vencimiento_poliza']);
        });
    }
};