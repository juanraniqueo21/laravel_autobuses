<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rutas', function (Blueprint $table) {
            $table->integer('tarifa')->nullable()->after('tiempo_estimado_minutos');
        });
    }

    public function down(): void
    {
        Schema::table('rutas', function (Blueprint $table) {
            $table->dropColumn('tarifa');
        });
    }
};

