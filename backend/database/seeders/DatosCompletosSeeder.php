<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Ruta;
use App\Models\RutaParada;
use App\Models\AsignacionTurno;
use App\Models\Conductor;
use App\Models\Asistente;
use App\Models\Bus;
use App\Models\Viaje;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DatosCompletosSeeder extends Seeder
{
    use WithoutModelEvents;

    // Precio combustible promedio (CLP/litro)
    const PRECIO_COMBUSTIBLE = 1100;

    private Carbon $fechaInicio;
    private Carbon $fechaFin;

    public function run(): void
    {
        // Período: Octubre, Noviembre y hasta 6 de Diciembre 2025
        $this->fechaInicio = Carbon::create(2025, 10, 1, 6);
        $this->fechaFin = Carbon::create(2025, 12, 6, 23);

        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('🚀 GENERANDO DATOS COMPLETOS PARA DEFENSA');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info("📅 Período: {$this->fechaInicio->format('d/m/Y')} - {$this->fechaFin->format('d/m/Y')}");

        DB::beginTransaction();

        try {
            // PASO 1: Rutas
            $this->command->newLine();
            $this->command->info('📍 [1/4] Creando rutas del sur de Chile...');
            $rutas = $this->crearRutas();

            // PASO 2: Turnos
            $this->command->newLine();
            $this->command->info('📅 [2/4] Generando turnos con asignación de personal...');
            $turnos = $this->crearTurnos($rutas);

            // PASO 3: Viajes
            $this->command->newLine();
            $this->command->info('🚌 [3/4] Creando viajes (algunos cancelados)...');
            $estadisticas = $this->crearViajes($turnos);

            // PASO 4: Resumen
            $this->command->newLine();
            $this->mostrarResumen($rutas, $turnos, $estadisticas);

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('❌ Error: ' . $e->getMessage());
            $this->command->error($e->getTraceAsString());
        }
    }

    private function crearRutas()
    {
        $rutasData = [
            // RUTAS EXISTENTES
            [
                'nombre' => 'Temuco - Pucón',
                'codigo' => 'R-PUCON',
                'origen' => 'Terminal Temuco',
                'destino' => 'Rodoviario Pucón',
                'tarifas_base' => ['adulto' => 9800, 'estudiante' => 7200, 'tercera_edad' => 6200],
                'paradas' => [
                    ['ciudad' => 'Terminal Temuco', 'distancia' => 0, 'tiempo' => 0, 'es_origen' => true],
                    ['ciudad' => 'Freire', 'distancia' => 28, 'tiempo' => 24],
                    ['ciudad' => 'Pitrufquén', 'distancia' => 12, 'tiempo' => 11],
                    ['ciudad' => 'Loncoche', 'distancia' => 36, 'tiempo' => 33],
                    ['ciudad' => 'Villarrica', 'distancia' => 34, 'tiempo' => 32],
                    ['ciudad' => 'Rodoviario Pucón', 'distancia' => 27, 'tiempo' => 30, 'es_destino' => true],
                ],
            ],
            [
                'nombre' => 'Temuco - Puerto Montt',
                'codigo' => 'R-SUR',
                'origen' => 'Terminal Temuco',
                'destino' => 'Terminal Puerto Montt',
                'tarifas_base' => ['adulto' => 18900, 'estudiante' => 13500, 'tercera_edad' => 11200],
                'paradas' => [
                    ['ciudad' => 'Terminal Temuco', 'distancia' => 0, 'tiempo' => 0, 'es_origen' => true],
                    ['ciudad' => 'Freire', 'distancia' => 28, 'tiempo' => 24],
                    ['ciudad' => 'Pitrufquén', 'distancia' => 12, 'tiempo' => 11],
                    ['ciudad' => 'Loncoche', 'distancia' => 36, 'tiempo' => 33],
                    ['ciudad' => 'Lanco', 'distancia' => 24, 'tiempo' => 23],
                    ['ciudad' => 'Valdivia', 'distancia' => 48, 'tiempo' => 45],
                    ['ciudad' => 'Osorno', 'distancia' => 110, 'tiempo' => 95],
                    ['ciudad' => 'Puerto Varas', 'distancia' => 32, 'tiempo' => 30],
                    ['ciudad' => 'Terminal Puerto Montt', 'distancia' => 20, 'tiempo' => 22, 'es_destino' => true],
                ],
            ],
            [
                'nombre' => 'Concepción - Temuco',
                'codigo' => 'R-BIOBIO',
                'origen' => 'Terminal Concepción',
                'destino' => 'Terminal Temuco',
                'tarifas_base' => ['adulto' => 15400, 'estudiante' => 11000, 'tercera_edad' => 8800],
                'paradas' => [
                    ['ciudad' => 'Terminal Concepción', 'distancia' => 0, 'tiempo' => 0, 'es_origen' => true],
                    ['ciudad' => 'Chillán', 'distancia' => 102, 'tiempo' => 90],
                    ['ciudad' => 'Los Ángeles', 'distancia' => 82, 'tiempo' => 75],
                    ['ciudad' => 'Collipulli', 'distancia' => 98, 'tiempo' => 86],
                    ['ciudad' => 'Victoria', 'distancia' => 32, 'tiempo' => 30],
                    ['ciudad' => 'Terminal Temuco', 'distancia' => 58, 'tiempo' => 52, 'es_destino' => true],
                ],
            ],
            [
                'nombre' => 'Valdivia - Villarrica',
                'codigo' => 'R-LACUSTRE',
                'origen' => 'Terminal Valdivia',
                'destino' => 'Terminal Villarrica',
                'tarifas_base' => ['adulto' => 8600, 'estudiante' => 6200, 'tercera_edad' => 5200],
                'paradas' => [
                    ['ciudad' => 'Terminal Valdivia', 'distancia' => 0, 'tiempo' => 0, 'es_origen' => true],
                    ['ciudad' => 'Lanco', 'distancia' => 47, 'tiempo' => 45],
                    ['ciudad' => 'Loncoche', 'distancia' => 24, 'tiempo' => 23],
                    ['ciudad' => 'Villarrica', 'distancia' => 34, 'tiempo' => 32, 'es_destino' => true],
                ],
            ],
            // NUEVAS RUTAS DEL SUR DE CHILE
            [
                'nombre' => 'Santiago - Temuco',
                'codigo' => 'R-CAPITAL',
                'origen' => 'Terminal Alameda Santiago',
                'destino' => 'Terminal Temuco',
                'tarifas_base' => ['adulto' => 28000, 'estudiante' => 21000, 'tercera_edad' => 18000],
                'paradas' => [
                    ['ciudad' => 'Terminal Alameda Santiago', 'distancia' => 0, 'tiempo' => 0, 'es_origen' => true],
                    ['ciudad' => 'Rancagua', 'distancia' => 87, 'tiempo' => 75],
                    ['ciudad' => 'Curicó', 'distancia' => 108, 'tiempo' => 95],
                    ['ciudad' => 'Talca', 'distancia' => 52, 'tiempo' => 45],
                    ['ciudad' => 'Chillán', 'distancia' => 146, 'tiempo' => 120],
                    ['ciudad' => 'Los Ángeles', 'distancia' => 102, 'tiempo' => 90],
                    ['ciudad' => 'Victoria', 'distancia' => 128, 'tiempo' => 110],
                    ['ciudad' => 'Terminal Temuco', 'distancia' => 58, 'tiempo' => 50, 'es_destino' => true],
                ],
            ],
            [
                'nombre' => 'Temuco - Valdivia',
                'codigo' => 'R-VALDIVIA',
                'origen' => 'Terminal Temuco',
                'destino' => 'Terminal Valdivia',
                'tarifas_base' => ['adulto' => 10500, 'estudiante' => 7800, 'tercera_edad' => 6500],
                'paradas' => [
                    ['ciudad' => 'Terminal Temuco', 'distancia' => 0, 'tiempo' => 0, 'es_origen' => true],
                    ['ciudad' => 'Freire', 'distancia' => 28, 'tiempo' => 24],
                    ['ciudad' => 'Pitrufquén', 'distancia' => 12, 'tiempo' => 11],
                    ['ciudad' => 'Loncoche', 'distancia' => 36, 'tiempo' => 33],
                    ['ciudad' => 'Lanco', 'distancia' => 24, 'tiempo' => 23],
                    ['ciudad' => 'Terminal Valdivia', 'distancia' => 48, 'tiempo' => 45, 'es_destino' => true],
                ],
            ],
            [
                'nombre' => 'Osorno - Puerto Montt',
                'codigo' => 'R-LAGOS',
                'origen' => 'Terminal Osorno',
                'destino' => 'Terminal Puerto Montt',
                'tarifas_base' => ['adulto' => 7200, 'estudiante' => 5400, 'tercera_edad' => 4500],
                'paradas' => [
                    ['ciudad' => 'Terminal Osorno', 'distancia' => 0, 'tiempo' => 0, 'es_origen' => true],
                    ['ciudad' => 'Puerto Octay', 'distancia' => 56, 'tiempo' => 50],
                    ['ciudad' => 'Frutillar', 'distancia' => 32, 'tiempo' => 30],
                    ['ciudad' => 'Puerto Varas', 'distancia' => 14, 'tiempo' => 15],
                    ['ciudad' => 'Terminal Puerto Montt', 'distancia' => 20, 'tiempo' => 22, 'es_destino' => true],
                ],
            ],
            [
                'nombre' => 'Valdivia - Osorno',
                'codigo' => 'R-RIOSUR',
                'origen' => 'Terminal Valdivia',
                'destino' => 'Terminal Osorno',
                'tarifas_base' => ['adulto' => 9200, 'estudiante' => 6800, 'tercera_edad' => 5700],
                'paradas' => [
                    ['ciudad' => 'Terminal Valdivia', 'distancia' => 0, 'tiempo' => 0, 'es_origen' => true],
                    ['ciudad' => 'Paillaco', 'distancia' => 42, 'tiempo' => 38],
                    ['ciudad' => 'Río Bueno', 'distancia' => 28, 'tiempo' => 26],
                    ['ciudad' => 'Purranque', 'distancia' => 32, 'tiempo' => 30],
                    ['ciudad' => 'Terminal Osorno', 'distancia' => 36, 'tiempo' => 33, 'es_destino' => true],
                ],
            ],
            [
                'nombre' => 'Temuco - Angol',
                'codigo' => 'R-FRONTERA',
                'origen' => 'Terminal Temuco',
                'destino' => 'Terminal Angol',
                'tarifas_base' => ['adulto' => 5400, 'estudiante' => 4000, 'tercera_edad' => 3300],
                'paradas' => [
                    ['ciudad' => 'Terminal Temuco', 'distancia' => 0, 'tiempo' => 0, 'es_origen' => true],
                    ['ciudad' => 'Lautaro', 'distancia' => 34, 'tiempo' => 32],
                    ['ciudad' => 'Victoria', 'distancia' => 28, 'tiempo' => 26],
                    ['ciudad' => 'Collipulli', 'distancia' => 32, 'tiempo' => 30],
                    ['ciudad' => 'Terminal Angol', 'distancia' => 38, 'tiempo' => 35, 'es_destino' => true],
                ],
            ],
            [
                'nombre' => 'Puerto Montt - Castro (Chiloé)',
                'codigo' => 'R-CHILOE',
                'origen' => 'Terminal Puerto Montt',
                'destino' => 'Terminal Castro',
                'tarifas_base' => ['adulto' => 11500, 'estudiante' => 8500, 'tercera_edad' => 7000],
                'paradas' => [
                    ['ciudad' => 'Terminal Puerto Montt', 'distancia' => 0, 'tiempo' => 0, 'es_origen' => true],
                    ['ciudad' => 'Pargua (Ferry)', 'distancia' => 58, 'tiempo' => 55],
                    ['ciudad' => 'Chacao', 'distancia' => 8, 'tiempo' => 35],
                    ['ciudad' => 'Ancud', 'distancia' => 28, 'tiempo' => 26],
                    ['ciudad' => 'Dalcahue', 'distancia' => 52, 'tiempo' => 48],
                    ['ciudad' => 'Terminal Castro', 'distancia' => 18, 'tiempo' => 18, 'es_destino' => true],
                ],
            ],
        ];

        $rutas = collect();

        foreach ($rutasData as $data) {
            $totalDistancia = array_sum(array_column($data['paradas'], 'distancia'));
            $totalTiempo = array_sum(array_column($data['paradas'], 'tiempo'));

            $ruta = Ruta::create([
                'nombre_ruta' => $data['nombre'],
                'codigo_ruta' => $data['codigo'],
                'origen' => $data['origen'],
                'destino' => $data['destino'],
                'distancia_km' => $totalDistancia,
                'tiempo_estimado_minutos' => $totalTiempo ?: intval($totalDistancia * 1.5),
                'estado' => 'activa',
                'tarifa_base_adulto' => $data['tarifas_base']['adulto'],
                'tarifa_base_estudiante' => $data['tarifas_base']['estudiante'],
                'tarifa_base_tercera_edad' => $data['tarifas_base']['tercera_edad'],
            ]);

            $paradasCreadas = $this->crearParadasParaRuta($ruta, $data['paradas'], $data['tarifas_base']);

            $rutas->push($ruta);
            $this->command->info("   ✓ {$data['codigo']} - {$data['nombre']} ({$paradasCreadas} paradas, {$totalDistancia} km)");
        }

        return $rutas;
    }

    private function crearParadasParaRuta(Ruta $ruta, array $paradas, array $tarifasBase): int
    {
        $acumulado = 0;
        $totalDistancia = array_sum(array_column($paradas, 'distancia')) ?: 1;
        $totalTiempo = array_sum(array_column($paradas, 'tiempo')) ?: 0;

        foreach ($paradas as $index => $parada) {
            $acumulado += ($index === 0 ? 0 : $parada['distancia']);
            $progreso = $acumulado / $totalDistancia;

            $tarifas = $this->calcularTarifasProporcionales($tarifasBase, $progreso);

            RutaParada::create([
                'ruta_id' => $ruta->id,
                'orden' => $index + 1,
                'ciudad' => $parada['ciudad'],
                'es_origen' => $parada['es_origen'] ?? false,
                'es_destino' => $parada['es_destino'] ?? false,
                'distancia_desde_anterior_km' => $index === 0 ? 0 : $parada['distancia'],
                'tiempo_desde_anterior_min' => $index === 0 ? 0 : ($parada['tiempo'] ?? $this->calcularTiempoPorDistancia($parada['distancia'])),
                'tarifa_adulto' => $tarifas['adulto'],
                'tarifa_estudiante' => $tarifas['estudiante'],
                'tarifa_tercera_edad' => $tarifas['tercera_edad'],
            ]);
        }

        $ruta->update([
            'distancia_km' => $totalDistancia,
            'tiempo_estimado_minutos' => $totalTiempo ?: intval($totalDistancia * 1.5),
        ]);

        return count($paradas);
    }

    private function calcularTarifasProporcionales(array $tarifasBase, float $progreso): array
    {
        $roundTo = function ($valor) {
            return intval(round($valor / 50)) * 50;
        };

        return [
            'adulto' => $roundTo($tarifasBase['adulto'] * $progreso),
            'estudiante' => $roundTo($tarifasBase['estudiante'] * $progreso),
            'tercera_edad' => $roundTo($tarifasBase['tercera_edad'] * $progreso),
        ];
    }

    private function calcularTiempoPorDistancia(int|float $distancia): int
    {
        return intval(round($distancia * 0.92));
    }

    private function crearTurnos($rutas)
    {
        $conductores = Conductor::whereHas('empleado', function($q) {
            $q->where('estado', 'activo');
        })->get();

        $asistentes = Asistente::whereHas('empleado', function($q) {
            $q->where('estado', 'activo');
        })->get();

        $buses = Bus::whereIn('estado', ['operativo', 'activo'])->get();

        if ($conductores->isEmpty() || $buses->isEmpty()) {
            $this->command->warn('   ⚠️  No hay suficiente personal o buses. Saltando turnos.');
            return collect();
        }

        $turnos = collect();
        $conductoresUsados = collect();
        $asistentesUsados = collect();

        // Recorrer cada día del período
        $fechaActual = $this->fechaInicio->copy();
        
        while ($fechaActual->lte($this->fechaFin)) {
            $fecha = $fechaActual->format('Y-m-d');
            $conductoresUsados = collect(); // Reset diario
            $asistentesUsados = collect(); // Reset diario

            foreach ($buses as $bus) {
                $esDoblePiso = $bus->tipo_bus === 'doble_piso';
                
                // Buses doble piso: turno completo (1 turno)
                // Buses un piso: 2 turnos (mañana y tarde)
                $turnosPorBus = $esDoblePiso ? 1 : 2;

                for ($turnoIndex = 0; $turnoIndex < $turnosPorBus; $turnoIndex++) {
                    $ruta = $rutas->random();
                    
                    // Determinar tipo de turno y horarios
                    if ($esDoblePiso) {
                        $tipoTurno = 'completo';
                        $horaInicio = '06:00:00';
                        $horaTermino = '22:00:00';
                    } else {
                        $tipoTurno = $turnoIndex === 0 ? 'mañana' : 'tarde';
                        $horaInicio = $turnoIndex === 0 ? '06:00:00' : '14:00:00';
                        $horaTermino = $turnoIndex === 0 ? '14:00:00' : '22:00:00';
                    }

                    // Crear turno
                    $turno = AsignacionTurno::create([
                        'bus_id' => $bus->id,
                        'fecha_turno' => $fecha,
                        'hora_inicio' => $horaInicio,
                        'hora_termino' => $horaTermino,
                        'tipo_turno' => $tipoTurno,
                        'estado' => 'completado',
                    ]);

                    // ASIGNAR CONDUCTORES
                    if ($esDoblePiso) {
                        // Buses doble piso: 2-3 conductores
                        $cantidadConductores = rand(2, 3);
                    } else {
                        // Buses un piso: 1 conductor
                        $cantidadConductores = 1;
                    }

                    $conductoresDisponibles = $conductores->reject(function($c) use ($conductoresUsados) {
                        return $conductoresUsados->contains($c->id);
                    });

                    if ($conductoresDisponibles->count() >= $cantidadConductores) {
                        $conductoresAsignados = $conductoresDisponibles->random($cantidadConductores);
                        
                        foreach ($conductoresAsignados as $index => $conductor) {
                            DB::table('turno_conductores')->insert([
                                'asignacion_turno_id' => $turno->id,
                                'conductor_id' => $conductor->id,
                                'rol' => $index === 0 ? 'principal' : 'apoyo',
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                            $conductoresUsados->push($conductor->id);
                        }
                    }

                    // ASIGNAR ASISTENTE (opcional para buses de un piso, obligatorio para doble piso)
                    if ($asistentes->isNotEmpty()) {
                        $probabilidadAsistente = $esDoblePiso ? 100 : 30; // 100% doble piso, 30% un piso
                        
                        if (rand(1, 100) <= $probabilidadAsistente) {
                            $asistentesDisponibles = $asistentes->reject(function($a) use ($asistentesUsados) {
                                return $asistentesUsados->contains($a->id);
                            });

                            if ($asistentesDisponibles->isNotEmpty()) {
                                $asistente = $asistentesDisponibles->random();
                                
                                DB::table('turno_asistentes')->insert([
                                    'asignacion_turno_id' => $turno->id,
                                    'asistente_id' => $asistente->id,
                                    'posicion' => $esDoblePiso ? 'piso_superior' : 'general',
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                                $asistentesUsados->push($asistente->id);
                            }
                        }
                    }

                    $turnos->push([
                        'turno' => $turno,
                        'ruta' => $ruta,
                        'tipo' => $tipoTurno,
                    ]);
                }
            }

            $fechaActual->addDay();
        }

        $diasTotales = $this->fechaInicio->diffInDays($this->fechaFin) + 1;
        $this->command->info("   ✓ {$turnos->count()} turnos creados ({$diasTotales} días × {$buses->count()} buses)");
        return $turnos;
    }

    private function crearViajes($turnos)
    {
        if ($turnos->isEmpty()) {
            $this->command->warn('   ⚠️  No hay turnos. No se pueden crear viajes.');
            return ['total' => 0, 'completados' => 0, 'cancelados' => 0, 'con_alerta' => 0, 'ineficientes' => 0];
        }

        $viajesCreados = 0;
        $viajesCompletados = 0;
        $viajesCancelados = 0;
        $viajesConAlerta = 0;
        $viajesIneficientes = 0;

        $motivosCancelacion = [
            'Falla mecánica del bus',
            'Condiciones climáticas adversas',
            'Conductor no disponible por enfermedad',
            'Baja demanda de pasajeros',
            'Emergencia en ruta',
            'Mantenimiento preventivo urgente',
            'Bloqueo de ruta',
        ];

        foreach ($turnos as $turnoData) {
            $turno = $turnoData['turno'];
            $ruta = $turnoData['ruta'];
            $tipoTurno = $turnoData['tipo'];

            // Determinar cantidad de viajes según tipo de turno
            // Completo: 2 viajes (ida y vuelta)
            // Mañana/Tarde: 2 viajes (ida y vuelta)
            $cantidadViajes = $tipoTurno === 'completo' ? 2 : 2;

            for ($i = 0; $i < $cantidadViajes; $i++) {
                // 5% de probabilidad de cancelación
                $esCancelado = rand(1, 100) <= 5;
                
                $fechaViaje = Carbon::parse($turno->fecha_turno)
                    ->setTimeFromTimeString($turno->hora_inicio)
                    ->addHours($i * ($tipoTurno === 'completo' ? 8 : 4));

                $fechaLlegada = $fechaViaje->copy()->addMinutes($ruta->tiempo_estimado_minutos + rand(-15, 30));

                $bus = $turno->bus;

                if ($esCancelado) {
                    Viaje::create([
                        'asignacion_turno_id' => $turno->id,
                        'ruta_id' => $ruta->id,
                        'codigo_viaje' => 'VJ-' . str_pad($viajesCreados + 1, 6, '0', STR_PAD_LEFT),
                        'nombre_viaje' => ($i % 2 === 0 ? "Ida" : "Vuelta") . " {$ruta->origen} - {$ruta->destino}",
                        'fecha_hora_salida' => $fechaViaje,
                        'fecha_hora_llegada' => null,
                        'estado' => 'cancelado',
                        'observaciones' => $motivosCancelacion[array_rand($motivosCancelacion)],
                        'pasajeros_transportados' => 0,
                        'tarifa_aplicada' => 0,
                        'dinero_esperado' => 0,
                        'dinero_recaudado' => 0,
                        'diferencia_porcentaje' => 0,
                        'requiere_revision' => false,
                        'costo_combustible' => 0,
                        'costo_peajes' => 0,
                        'costo_mantencion' => 0,
                        'costo_total' => 0,
                    ]);
                    $viajesCancelados++;
                } else {
                    // RECAUDACIÓN
                    $pasajeros = rand(25, 50);
                    $tarifaBase = $ruta->tarifa_base_adulto;
                    $factorTarifa = $bus?->factor_tarifa ?? 1;
                    $tarifaAplicada = intval(round($tarifaBase * $factorTarifa));
                    $dineroEsperado = $pasajeros * $tarifaAplicada;

                    $factorRecaudacion = $this->obtenerFactorRecaudacion();
                    $dineroRecaudado = intval($dineroEsperado * $factorRecaudacion);

                    $diferenciaPorcentaje = round((abs($dineroEsperado - $dineroRecaudado) / $dineroEsperado) * 100, 2);
                    $requiereRevision = $diferenciaPorcentaje > 10;

                    if ($requiereRevision) {
                        $viajesConAlerta++;
                    }

                    // COSTOS
                    $distancia = $ruta->distancia_km ?: 10;
                    $consumoKm = $bus?->consumo_km ?? 2.8;
                    $litrosConsumidos = $distancia / $consumoKm;
                    $costoCombustible = intval($litrosConsumidos * self::PRECIO_COMBUSTIBLE);

                    $costoMantencion = intval($distancia * ($bus?->costo_mantencion_km ?? 120));
                    $costoPeajes = rand(2000, 8000);
                    $costoTotal = $costoCombustible + $costoMantencion + $costoPeajes;

                    Viaje::create([
                        'asignacion_turno_id' => $turno->id,
                        'ruta_id' => $ruta->id,
                        'codigo_viaje' => 'VJ-' . str_pad($viajesCreados + 1, 6, '0', STR_PAD_LEFT),
                        'nombre_viaje' => ($i % 2 === 0 ? "Ida" : "Vuelta") . " {$ruta->origen} - {$ruta->destino}",
                        'fecha_hora_salida' => $fechaViaje,
                        'fecha_hora_llegada' => $fechaLlegada,
                        'estado' => 'completado',
                        'pasajeros_transportados' => $pasajeros,
                        'tarifa_aplicada' => $tarifaAplicada,
                        'dinero_esperado' => $dineroEsperado,
                        'dinero_recaudado' => $dineroRecaudado,
                        'diferencia_porcentaje' => $diferenciaPorcentaje,
                        'requiere_revision' => $requiereRevision,
                        'costo_combustible' => $costoCombustible,
                        'costo_peajes' => $costoPeajes,
                        'costo_mantencion' => $costoMantencion,
                        'costo_total' => $costoTotal,
                    ]);

                    $viajesCompletados++;

                    if ($costoTotal > $dineroRecaudado) {
                        $viajesIneficientes++;
                    }
                }

                $viajesCreados++;
            }
        }

        $this->command->info("   ✓ {$viajesCreados} viajes creados ({$viajesCompletados} completados, {$viajesCancelados} cancelados)");
        $this->command->info("   ✓ {$viajesConAlerta} viajes con revisión, {$viajesIneficientes} con costos > recaudación");

        return [
            'total' => $viajesCreados,
            'completados' => $viajesCompletados,
            'cancelados' => $viajesCancelados,
            'con_alerta' => $viajesConAlerta,
            'ineficientes' => $viajesIneficientes,
        ];
    }

    private function obtenerFactorRecaudacion(): float
    {
        $rand = rand(1, 100);

        if ($rand <= 60) {
            return rand(90, 110) / 100; // ±10%
        } elseif ($rand <= 85) {
            return rand(110, 120) / 100; // +10 a +20%
        }

        return rand(80, 90) / 100; // -10 a -20%
    }

    private function mostrarResumen($rutas, $turnos, $estadisticas): void
    {
        $this->command->newLine();
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('📊 RESUMEN FINAL');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info("   📍 Rutas creadas: {$rutas->count()}");
        $this->command->info("   📅 Turnos creados: {$turnos->count()}");
        $this->command->info("   🚌 Viajes totales: {$estadisticas['total']}");
        $this->command->info("   ✅ Viajes completados: {$estadisticas['completados']}");
        $this->command->info("   ❌ Viajes cancelados: {$estadisticas['cancelados']}");
        $this->command->info("   ⚠️  Viajes con revisión: {$estadisticas['con_alerta']}");
        $this->command->info("   💰 Viajes con pérdida: {$estadisticas['ineficientes']}");
        $this->command->newLine();
    }
}