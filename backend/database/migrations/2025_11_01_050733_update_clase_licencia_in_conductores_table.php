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
        Schema::table('conductores', function (Blueprint $table) {
            $table->dropColumn('clase_licencia');

            
        });
        Schema::table('conductores', function (Blueprint $table) {
            $table->enum('clase_licencia', ['A', 'A2', 'A3', 'B', 'C', 'D', 'E'])->default('E');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conductores', function (Blueprint $table) {
            $table->dropColumn('clase_licencia');
        });
        Schema::table('conductores', function (Blueprint $table) {
            $table->enum('clase_licencia', ['A', 'B', 'C', 'D', 'E'])->default('E');
        });
    }
};
