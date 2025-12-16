<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('buses', function (Blueprint $table) {
            $table->date('emision_soap')->nullable()->after('numero_soap');
            $table->date('emision_permiso_circulacion')->nullable()->after('numero_permiso_circulacion');
            $table->date('vencimiento_permiso_circulacion')->nullable()->after('emision_permiso_circulacion');
        });
    }

    public function down(): void
    {
        Schema::table('buses', function (Blueprint $table) {
            $table->dropColumn(['emision_soap', 'emision_permiso_circulacion', 'vencimiento_permiso_circulacion']);
        });
    }
};
