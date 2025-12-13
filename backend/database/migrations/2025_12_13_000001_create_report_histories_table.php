<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('report_histories', function (Blueprint $table) {
            $table->id();
            $table->string('tipo');
            $table->unsignedTinyInteger('mes');
            $table->unsignedSmallInteger('anio');
            $table->json('filtros')->nullable();
            $table->string('archivo')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('report_histories');
    }
};
