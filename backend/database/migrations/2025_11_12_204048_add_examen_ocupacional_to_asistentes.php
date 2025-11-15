<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asistentes', function (Blueprint $table) {
            $table->date('fecha_examen_ocupacional')->nullable()->after('estado');
        });
    }

    public function down(): void
    {
        Schema::table('asistentes', function (Blueprint $table) {
            $table->dropColumn('fecha_examen_ocupacional');
        });
    }
};