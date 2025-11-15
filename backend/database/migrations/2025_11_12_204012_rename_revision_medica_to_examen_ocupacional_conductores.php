<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conductores', function (Blueprint $table) {
            $table->renameColumn('fecha_ultima_revision_medica', 'fecha_examen_ocupacional');
        });
    }

    public function down(): void
    {
        Schema::table('conductores', function (Blueprint $table) {
            $table->renameColumn('fecha_examen_ocupacional', 'fecha_ultima_revision_medica');
        });
    }
};