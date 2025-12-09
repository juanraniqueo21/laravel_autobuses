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
use App\Models\User;
use App\Models\Empleado;
use App\Models\Mecanico;
use App\Models\Mantenimiento;
use App\Models\Rol;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatosCompletosSeeder extends Seeder
{
    use WithoutModelEvents;

    // Precio combustible promedio (CLP/litro)
    const PRECIO_COMBUSTIBLE = 1100;

    private Carbon $fechaInicio;
    private Carbon $fechaFin;

    public function run(): void
    {
        // 📅 Período: Octubre, Noviembre y hasta 8 de Diciembre 2025 (alineado con BusSeeder)
        $this->fechaInicio = Carbon::create(2025, 10, 1, 6);
        $this->fechaFin = Carbon::create(2025, 12, 8, 23);

        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('🚀 GENERANDO DATOS COMPLETOS PARA DEFENSA');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info("📅 Período: {$this->fechaInicio->format('d/m/Y')} - {$this->fechaFin->format('d/m/Y')}");

        DB::beginTransaction();

        try {
            // PASO 1: Mecánicos
            $this->command->newLine();
            $this->command->info('🔧 [1/6] Creando mecánicos con especialidades...');
            $mecanicos = $this->crearMecanicos();

            // PASO 2: Rutas
            $this->command->newLine();
            $this->command->info('📍 [2/6] Creando rutas del sur de Chile...');
            $rutas = $this->crearRutas();

            // PASO 3: Turnos
            $this->command->newLine();
            $this->command->info('📅 [3/6] Generando turnos con asignación de personal...');
            $turnos = $this->crearTurnos($rutas);

            // PASO 4: Viajes
            $this->command->newLine();
            $this->command->info('🚌 [4/6] Creando viajes (algunos cancelados)...');
            $estadisticas = $this->crearViajes($turnos);

            // PASO 5: Mantenimientos
            $this->command->newLine();
            $this->command->info('🛠️  [5/6] Generando historial de mantenimientos...');
            $estadisticasMantenimientos = $this->crearMantenimientos($mecanicos);

            // === CORRECCIÓN DE ESTADOS DE BUSES ===
            // Forzamos que los buses con mantenimientos 'en_proceso' queden en estado 'mantenimiento'
            // ignorando la validación de fechas del modelo.
            $this->command->newLine();
            $this->command->info('🔄 Sincronizando estados de flota...');

            $busesEnTaller = Mantenimiento::where('estado', 'en_proceso')
                ->select('bus_id')
                ->distinct()
                ->pluck('bus_id');

            Bus::whereIn('id', $busesEnTaller)->update(['estado' => 'mantenimiento']);

            $this->command->info("   ✅ Se actualizaron {$busesEnTaller->count()} buses a estado 'mantenimiento'.");

            // PASO 6: Resumen
            $this->command->newLine();
            $this->mostrarResumen($rutas, $turnos, $estadisticas, $estadisticasMantenimientos);

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
                    // 🔧 FIX: No exceder capacidad del bus
                    $capacidadBus = $bus?->capacidad_pasajeros ?? 45;
                    $tasaOcupacion = rand(55, 95) / 100; // 55% a 95% de ocupación
                    $pasajeros = intval($capacidadBus * $tasaOcupacion);
                    $pasajeros = max(1, min($pasajeros, $capacidadBus)); // Entre 1 y capacidad máxima

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

                    // COSTOS REALISTAS
                    $distancia = $ruta->distancia_km ?: 10;
                    $consumoKm = $bus?->consumo_km ?? 2.8;
                    $litrosConsumidos = $distancia / $consumoKm;
                    $costoCombustible = intval($litrosConsumidos * self::PRECIO_COMBUSTIBLE);

                    $costoMantencion = intval($distancia * ($bus?->costo_mantencion_km ?? 120));
                    $costoPeajes = rand(2000, 8000);

                    // 💰 NUEVOS COSTOS REALISTAS
                    // Salarios proporcionales al viaje (considerando que un conductor gana ~$1,200,000/mes)
                    // Promedio 60 viajes/mes por conductor = ~$20,000 por viaje
                    $cantidadConductores = $turno->conductores()->count() ?: 1;
                    $cantidadAsistentes = $turno->asistentes()->count() ?: 0;
                    $costoSalarios = ($cantidadConductores * 20000) + ($cantidadAsistentes * 15000);

                    // Depreciación del bus (valor ~$80,000,000 / 10 años / 365 días / 2 viajes por día = ~$11,000 por viaje)
                    $costoDepreciacion = rand(8000, 14000);

                    // Seguros (anual ~$2,400,000 / 365 días / 2 viajes = ~$3,300 por viaje)
                    $costoSeguros = rand(2500, 4000);

                    // Costos administrativos (oficinas, personal, sistemas, etc.)
                    $costosAdministrativos = intval($dineroRecaudado * 0.08); // 8% de ingresos

                    $costoTotal = $costoCombustible + $costoMantencion + $costoPeajes
                                + $costoSalarios + $costoDepreciacion + $costoSeguros
                                + $costosAdministrativos;

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

    private function crearMecanicos()
    {
        $mecanicoRol = Rol::where('nombre', 'Mecanico')->first();

        $mecanicosData = [
            ['nombre' => 'Pedro', 'apellido' => 'González', 'rut' => '14502421', 'dv' => '8', 'especialidades' => ['motor_diesel', 'transmision']],
            ['nombre' => 'Luis', 'apellido' => 'Martínez', 'rut' => '6687585', 'dv' => '7', 'especialidades' => ['sistema_electrico', 'aire_acondicionado']],
            ['nombre' => 'Roberto', 'apellido' => 'Silva', 'rut' => '7290225', 'dv' => '4', 'especialidades' => ['frenos', 'suspension']],
            ['nombre' => 'Fernando', 'apellido' => 'Vásquez', 'rut' => '11249647', 'dv' => '5', 'especialidades' => ['motor_diesel', 'sistema_hidraulico']],
            ['nombre' => 'Mauricio', 'apellido' => 'Rojas', 'rut' => '12565857', 'dv' => '1', 'especialidades' => ['carroceria', 'neumaticos']],
            ['nombre' => 'Raúl', 'apellido' => 'Fernández', 'rut' => '10002376', 'dv' => '8', 'especialidades' => ['sistema_electrico', 'transmision']],
            ['nombre' => 'Marcos', 'apellido' => 'Pérez', 'rut' => '12943280', 'dv' => '2', 'especialidades' => ['frenos', 'suspension', 'neumaticos']],
            ['nombre' => 'Héctor', 'apellido' => 'Campos', 'rut' => '11927186', 'dv' => 'K', 'especialidades' => ['motor_diesel', 'sistema_hidraulico', 'transmision']],
        ];

        $mecanicos = collect();

        foreach ($mecanicosData as $index => $persona) {
            $user = User::firstOrCreate(
                ['email' => strtolower($persona['nombre']) . '.' . strtolower($persona['apellido']) . '@regionalsur.cl'],
                [
                    'nombre' => $persona['nombre'],
                    'apellido' => $persona['apellido'],
                    'rut' => $persona['rut'],
                    'rut_verificador' => $persona['dv'],
                    'password' => Hash::make('123456'),
                    'rol_id' => $mecanicoRol?->id,
                    'estado' => 'activo',
                ]
            );

            $empleado = Empleado::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'numero_empleado' => Empleado::generarNumeroEmpleado(),
                    'numero_funcional' => 'M-' . str_pad((string)($index + 1), 4, '0', STR_PAD_LEFT),
                    'fecha_contratacion' => now()->subMonths(rand(12, 60))->format('Y-m-d'),
                    'tipo_contrato' => 'indefinido',
                    'salario_base' => rand(950000, 1400000),
                    'afp_id' => rand(1, 7),
                    'tipo_fonasa' => ['A', 'B', 'C', 'D'][rand(0, 3)],
                    'isapre_id' => rand(1, 7),
                    'numero_seguro_cesantia' => 'SEC-M-' . str_pad((string)($index + 1), 5, '0', STR_PAD_LEFT),
                    'estado' => 'activo',
                    'ciudad' => ['Temuco', 'Valdivia', 'Osorno', 'Puerto Montt'][rand(0, 3)],
                    'direccion' => 'Taller Mecánico ' . ($index + 1),
                    'telefono_personal' => '9 ' . rand(5000, 9999) . ' ' . rand(5000, 9999),
                    'fecha_nacimiento' => now()->subYears(rand(28, 55))->startOfMonth()->format('Y-m-d'),
                    'genero' => 'masculino',
                    'contacto_emergencia_nombre' => 'Contacto de ' . $persona['nombre'],
                    'contacto_emergencia_telefono' => '9 ' . rand(5000, 9999) . ' ' . rand(5000, 9999),
                    'banco' => ['BancoEstado', 'Banco de Chile', 'Santander', 'BCI'][rand(0, 3)],
                    'tipo_cuenta' => ['vista', 'corriente'][rand(0, 1)],
                    'numero_cuenta' => '30' . str_pad((string)($index + 1), 8, '0', STR_PAD_LEFT),
                ]
            );

            $mecanico = Mecanico::firstOrCreate(
                ['empleado_id' => $empleado->id],
                [
                    'numero_certificacion' => 'CERT-MEC-' . str_pad((string)($index + 1), 4, '0', STR_PAD_LEFT),
                    'especialidad' => $persona['especialidades'],
                    'fecha_certificacion' => now()->subYears(rand(2, 8))->format('Y-m-d'),
                    'estado' => 'activo',
                    'fecha_examen_ocupacional' => now()->subMonths(rand(1, 11))->format('Y-m-d'),
                ]
            );

            $mecanicos->push($mecanico);

            $especialidadesStr = implode(', ', $persona['especialidades']);
            $this->command->info("   ✓ {$persona['nombre']} {$persona['apellido']} - Especialidades: {$especialidadesStr}");
        }

        $this->command->info("   ✅ {$mecanicos->count()} mecánicos creados");
        return $mecanicos;
    }

    private function crearMantenimientos($mecanicos)
    {
        if ($mecanicos->isEmpty()) {
            $this->command->warn('   ⚠️  No hay mecánicos. No se pueden crear mantenimientos.');
            return ['total' => 0, 'preventivos' => 0, 'correctivos' => 0, 'en_proceso' => 0];
        }

        $buses = Bus::all();

        if ($buses->isEmpty()) {
            $this->command->warn('   ⚠️  No hay buses. No se pueden crear mantenimientos.');
            return ['total' => 0, 'preventivos' => 0, 'correctivos' => 0, 'en_proceso' => 0];
        }

        $tiposMantenimiento = [
            'preventivo' => [
                'tipos_falla' => ['Cambio de aceite', 'Revisión general', 'Cambio de filtros', 'Inspección de frenos', 'Alineación y balanceo'],
                'costo_min' => 80000,
                'costo_max' => 250000,
                'duracion_min' => 1,
                'duracion_max' => 2,
            ],
            'correctivo' => [
                'tipos_falla' => [
                    'Falla en motor' => ['motor_diesel'],
                    'Problema eléctrico' => ['sistema_electrico'],
                    'Falla en transmisión' => ['transmision'],
                    'Problema de frenos' => ['frenos'],
                    'Falla en suspensión' => ['suspension'],
                    'Sistema hidráulico defectuoso' => ['sistema_hidraulico'],
                    'Aire acondicionado no funciona' => ['aire_acondicionado'],
                    'Daño en carrocería' => ['carroceria'],
                    'Neumáticos desgastados' => ['neumaticos'],
                ],
                'costo_min' => 150000,
                'costo_max' => 2500000,
                'duracion_min' => 1,
                'duracion_max' => 7,
            ],
        ];

        $mantenimientosCreados = 0;
        $preventivos = 0;
        $correctivos = 0;
        $enProceso = 0;

        foreach ($buses as $bus) {
            // Cada bus tiene entre 2 y 6 mantenimientos en el período
            $cantidadMantenimientos = rand(2, 6);

            for ($i = 0; $i < $cantidadMantenimientos; $i++) {
                $tipo = rand(1, 100) <= 60 ? 'preventivo' : 'correctivo'; // 60% preventivo, 40% correctivo
                $config = $tiposMantenimiento[$tipo];

                // Fecha de inicio aleatoria dentro del período
                $diasAtras = rand(0, $this->fechaInicio->diffInDays($this->fechaFin));
                $fechaInicio = $this->fechaInicio->copy()->addDays($diasAtras);

                // Duración del mantenimiento
                $duracionDias = rand($config['duracion_min'], $config['duracion_max']);
                $fechaTermino = $fechaInicio->copy()->addDays($duracionDias);

                // Determinar estado usando la fecha simulada (fechaFin) como "hoy"
                if ($fechaInicio->gt($this->fechaFin)) {
                    $estado = 'pendiente';
                } elseif ($fechaInicio->lte($this->fechaFin) && $fechaTermino->gt($this->fechaFin)) {
                    $estado = 'en_proceso';
                    $enProceso++;
                } else {
                    $estado = 'completado';
                }

                // Seleccionar descripción y mecánico apropiado
                if ($tipo === 'preventivo') {
                    $descripcion = $config['tipos_falla'][array_rand($config['tipos_falla'])];
                    $mecanico = $mecanicos->random();
                    $preventivos++;
                } else {
                    $descripcionKey = array_rand($config['tipos_falla']);
                    $descripcion = $descripcionKey;
                    $especialidadRequerida = $config['tipos_falla'][$descripcionKey];

                    // Buscar mecánico con la especialidad
                    $mecanicoEspecializado = $mecanicos->first(function($mec) use ($especialidadRequerida) {
                        return !empty(array_intersect($mec->especialidad ?? [], $especialidadRequerida));
                    });

                    $mecanico = $mecanicoEspecializado ?? $mecanicos->random();
                    $correctivos++;
                }

                // Costo
                $costoTotal = rand($config['costo_min'], $config['costo_max']);

                // Repuestos (solo para completados)
                $repuestos = $estado === 'completado' ? [
                    ['nombre' => 'Filtro de aceite', 'cantidad' => rand(1, 2), 'costo' => rand(8000, 15000)],
                    ['nombre' => 'Filtro de aire', 'cantidad' => 1, 'costo' => rand(12000, 20000)],
                ] : null;

                Mantenimiento::create([
                    'bus_id' => $bus->id,
                    'mecanico_id' => $mecanico->id,
                    'tipo_mantenimiento' => $tipo,
                    'descripcion' => $descripcion,
                    'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                    'fecha_termino' => $estado === 'completado' ? $fechaTermino->format('Y-m-d') : null,
                    'costo_total' => $estado === 'completado' ? $costoTotal : null,
                    'estado' => $estado,
                    'repuestos_utilizados' => $repuestos,
                    'observaciones' => $estado === 'en_proceso' ? 'Mantenimiento actualmente en curso' : null,
                ]);

                $mantenimientosCreados++;
            }
        }

        $this->command->info("   ✓ {$mantenimientosCreados} mantenimientos creados");
        $this->command->info("   ✓ {$preventivos} preventivos, {$correctivos} correctivos, {$enProceso} en proceso");

        return [
            'total' => $mantenimientosCreados,
            'preventivos' => $preventivos,
            'correctivos' => $correctivos,
            'en_proceso' => $enProceso,
        ];
    }

    private function mostrarResumen($rutas, $turnos, $estadisticas, $estadisticasMantenimientos = null): void
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

        if ($estadisticasMantenimientos) {
            $this->command->newLine();
            $this->command->info("   🔧 Mantenimientos totales: {$estadisticasMantenimientos['total']}");
            $this->command->info("   🛡️  Preventivos: {$estadisticasMantenimientos['preventivos']}");
            $this->command->info("   🔨 Correctivos: {$estadisticasMantenimientos['correctivos']}");
            $this->command->info("   ⚙️  En proceso: {$estadisticasMantenimientos['en_proceso']}");
        }

        $this->command->newLine();
    }
}
