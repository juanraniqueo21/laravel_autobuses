<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Paso 1: Crear columna temporal isapre_id_temp
        Schema::table('empleados', function (Blueprint $table) {
            $table->unsignedBigInteger('isapre_id_temp')->nullable()->after('tipo_fonasa');
        });

        // Paso 2: Migrar datos de isapre_nombre a isapre_id_temp
        // (Si hay datos existentes, crearlos en tabla isapres primero)
        $isapres = DB::table('empleados')
            ->whereNotNull('isapre_nombre')
            ->distinct('isapre_nombre')
            ->pluck('isapre_nombre');

        foreach ($isapres as $nombre) {
            if ($nombre && trim($nombre) !== '') {
                $isapre = DB::table('isapres')->where('nombre', $nombre)->first();
                if ($isapre) {
                    DB::table('empleados')
                        ->where('isapre_nombre', $nombre)
                        ->update(['isapre_id_temp' => $isapre->id]);
                }
            }
        }

        // Paso 3: Eliminar columna vieja y renombrar la nueva
        Schema::table('empleados', function (Blueprint $table) {
            $table->dropColumn('isapre_nombre');
        });

        Schema::table('empleados', function (Blueprint $table) {
            $table->renameColumn('isapre_id_temp', 'isapre_id');
            $table->foreign('isapre_id')->references('id')->on('isapres')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            // Revertir foreign key
            $table->dropForeign(['isapre_id']);
            
            // Crear columna vieja nuevamente
            $table->string('isapre_nombre', 100)->nullable()->after('tipo_fonasa');
            
            // Migrar datos de vuelta
            $empleados = DB::table('empleados')
                ->whereNotNull('isapre_id')
                ->get();

            foreach ($empleados as $empleado) {
                $isapre = DB::table('isapres')->find($empleado->isapre_id);
                if ($isapre) {
                    DB::table('empleados')
                        ->where('id', $empleado->id)
                        ->update(['isapre_nombre' => $isapre->nombre]);
                }
            }
            
            // Eliminar columna isapre_id
            $table->dropColumn('isapre_id');
        });
    }
};