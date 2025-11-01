<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            // Cambiar fonasa (booleano) a tipo_fonasa (enum)
            $table->dropColumn('fonasa');
            $table->enum('tipo_fonasa', ['A', 'B', 'C', 'D'])->default('B')->after('afp_id');
        });
    }

    public function down(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            $table->dropColumn('tipo_fonasa');
            $table->boolean('fonasa')->default(true);
        });
    }
};