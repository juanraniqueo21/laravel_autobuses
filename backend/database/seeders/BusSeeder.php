<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Bus;
use Carbon\Carbon;

class BusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 📅 REFERENCIA: 8 de Diciembre de 2025 (Hoy simulado)
        $fechaReferencia = Carbon::create(2025, 12, 8);

        $buses = [
            // ============================================
            // BUSES CLÁSICOS (1 piso, servicio básico)
            // Factor tarifa: 1.0x (tarifa base)
            // Capacidad: 45 pasajeros
            // ============================================
            [
                'patente' => 'BCHV12',
                'patente_verificador' => '3',
                'marca' => 'Mercedes-Benz',
                'modelo' => 'OF-1721',
                'anio' => 2018,
                'tipo_combustible' => 'diesel',
                'numero_serie' => 'MB18CL001',
                'numero_motor' => 'OM906001',
                'numero_chasis' => 'CH18001',
                'capacidad_pasajeros' => 45,
                'tipo_bus' => 'simple',
                'tipo_servicio' => 'clasico',
                'factor_tarifa' => 1.0,
                'cantidad_ejes' => '2',
                'marca_motor' => 'Mercedes-Benz',
                'modelo_motor' => 'OM-906',
                'ubicacion_motor' => 'trasero',
                'marca_chasis' => 'Mercedes-Benz',
                'marca_carroceria' => 'Marcopolo',
                'modelo_carroceria' => 'Viaggio',
                'fecha_adquisicion' => '2018-03-15',
                'estado' => 'operativo',
                'proxima_revision_tecnica' => $fechaReferencia->copy()->addDays(12),
                'ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(5)->subDays(10),
                'vencimiento_soap' => $fechaReferencia->copy()->addDays(5),
                'numero_soap' => 'SOAP2024001',
                'compania_seguro' => 'HDI Seguros',
                'numero_poliza' => 'POL2024001',
                'tipo_cobertura_adicional' => 'terceros',
                'vencimiento_poliza' => $fechaReferencia->copy()->addMonths(8),
                'numero_permiso_circulacion' => 'PC2024001',
                'kilometraje_original' => 125000,
                'proximo_mantenimiento_km' => 10000,
                'fecha_ultimo_mantenimiento' => $fechaReferencia->copy()->subMonths(2),
                'fecha_proximo_mantenimiento' => $fechaReferencia->copy()->addMonth(),
                'kilometraje_actual' => 120000,
                'kilometraje_ultimo_cambio_aceite' => 114500,
                'tipo_aceite_motor' => 'sintético',
                'fecha_ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(5),
            ],
            [
                'patente' => 'DGTY45',
                'patente_verificador' => '7',
                'marca' => 'Volvo',
                'modelo' => 'B7R',
                'anio' => 2019,
                'tipo_combustible' => 'diesel',
                'numero_serie' => 'VLV19CL002',
                'numero_motor' => 'D11002',
                'numero_chasis' => 'CH19002',
                'capacidad_pasajeros' => 45,
                'tipo_bus' => 'simple',
                'tipo_servicio' => 'clasico',
                'factor_tarifa' => 1.0,
                'cantidad_ejes' => '2',
                'marca_motor' => 'Volvo',
                'modelo_motor' => 'D11',
                'ubicacion_motor' => 'trasero',
                'marca_chasis' => 'Volvo',
                'marca_carroceria' => 'Caio',
                'modelo_carroceria' => 'Apache Vip',
                'fecha_adquisicion' => '2019-06-20',
                'estado' => 'operativo',
                'proxima_revision_tecnica' => $fechaReferencia->copy()->addDays(20),
                'ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(6)->subDays(5),
                'vencimiento_soap' => $fechaReferencia->copy()->addDays(18),
                'numero_soap' => 'SOAP2024002',
                'compania_seguro' => 'Mapfre',
                'numero_poliza' => 'POL2024002',
                'tipo_cobertura_adicional' => 'terceros',
                'vencimiento_poliza' => $fechaReferencia->copy()->addMonths(7),
                'numero_permiso_circulacion' => 'PC2024002',
                'kilometraje_original' => 95000,
                'proximo_mantenimiento_km' => 10000,
                'fecha_ultimo_mantenimiento' => $fechaReferencia->copy()->subMonths(1),
                'fecha_proximo_mantenimiento' => $fechaReferencia->copy()->addMonths(2),
                'kilometraje_actual' => 120000,
                'kilometraje_ultimo_cambio_aceite' => 114500,
                'tipo_aceite_motor' => 'sintético',
                'fecha_ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(5),
            ],
            [
                'patente' => 'FFRT89',
                'patente_verificador' => '2',
                'marca' => 'Scania',
                'modelo' => 'K310',
                'anio' => 2020,
                'tipo_combustible' => 'diesel',
                'numero_serie' => 'SCN20CL003',
                'numero_motor' => 'DC13003',
                'numero_chasis' => 'CH20003',
                'capacidad_pasajeros' => 45,
                'tipo_bus' => 'simple',
                'tipo_servicio' => 'clasico',
                'factor_tarifa' => 1.0,
                'cantidad_ejes' => '2',
                'marca_motor' => 'Scania',
                'modelo_motor' => 'DC13',
                'ubicacion_motor' => 'trasero',
                'marca_chasis' => 'Scania',
                'marca_carroceria' => 'Metalpar',
                'modelo_carroceria' => 'Tronador',
                'fecha_adquisicion' => '2020-01-10',
                'estado' => 'operativo',
                'proxima_revision_tecnica' => $fechaReferencia->copy()->addMonths(5),
                'ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(7),
                'vencimiento_soap' => $fechaReferencia->copy()->addMonths(6),
                'numero_soap' => 'SOAP2024003',
                'compania_seguro' => 'Liberty Seguros',
                'numero_poliza' => 'POL2024003',
                'tipo_cobertura_adicional' => 'full',
                'vencimiento_poliza' => $fechaReferencia->copy()->addMonths(9),
                'numero_permiso_circulacion' => 'PC2024003',
                'kilometraje_original' => 68000,
                'proximo_mantenimiento_km' => 10000,
                'fecha_ultimo_mantenimiento' => $fechaReferencia->copy()->subWeeks(3),
                'fecha_proximo_mantenimiento' => $fechaReferencia->copy()->addMonths(2),
                'kilometraje_actual' => 120000,
                'kilometraje_ultimo_cambio_aceite' => 114500,
                'tipo_aceite_motor' => 'sintético',
                'fecha_ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(5),
            ],

            // ============================================
            // BUSES SEMICAMA (2 pisos, asientos reclinables)
            // Factor tarifa: 1.4x (40% más caro)
            // Capacidad: 38 pasajeros
            // ============================================
            [
                'patente' => 'HJKL23',
                'patente_verificador' => '5',
                'marca' => 'Mercedes-Benz',
                'modelo' => 'O-500R',
                'anio' => 2020,
                'tipo_combustible' => 'diesel',
                'numero_serie' => 'MB20SC001',
                'numero_motor' => 'OM457001',
                'numero_chasis' => 'CH20SC001',
                'capacidad_pasajeros' => 38,
                'tipo_bus' => 'doble_piso',
                'tipo_servicio' => 'semicama',
                'factor_tarifa' => 1.4,
                'cantidad_ejes' => '3',
                'marca_motor' => 'Mercedes-Benz',
                'modelo_motor' => 'OM-457',
                'ubicacion_motor' => 'trasero',
                'marca_chasis' => 'Mercedes-Benz',
                'marca_carroceria' => 'Marcopolo',
                'modelo_carroceria' => 'Paradiso 1200',
                'fecha_adquisicion' => '2020-08-15',
                'estado' => 'operativo',
                'proxima_revision_tecnica' => $fechaReferencia->copy()->addMonths(3),
                'ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(9),
                'vencimiento_soap' => $fechaReferencia->copy()->addMonths(7),
                'numero_soap' => 'SOAP2024004',
                'compania_seguro' => 'HDI Seguros',
                'numero_poliza' => 'POL2024004',
                'tipo_cobertura_adicional' => 'full',
                'vencimiento_poliza' => $fechaReferencia->copy()->addMonths(10),
                'numero_permiso_circulacion' => 'PC2024004',
                'kilometraje_original' => 82000,
                'proximo_mantenimiento_km' => 10000,
                'fecha_ultimo_mantenimiento' => $fechaReferencia->copy()->subMonths(1),
                'fecha_proximo_mantenimiento' => $fechaReferencia->copy()->addMonths(2),
                'kilometraje_actual' => 120000,
                'kilometraje_ultimo_cambio_aceite' => 114500,
                'tipo_aceite_motor' => 'sintético',
                'fecha_ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(5),
            ],
            [
                'patente' => 'PLMN67',
                'patente_verificador' => '1',
                'marca' => 'Volvo',
                'modelo' => 'B12M',
                'anio' => 2021,
                'tipo_combustible' => 'diesel',
                'numero_serie' => 'VLV21SC002',
                'numero_motor' => 'D13002',
                'numero_chasis' => 'CH21SC002',
                'capacidad_pasajeros' => 38,
                'tipo_bus' => 'doble_piso',
                'tipo_servicio' => 'semicama',
                'factor_tarifa' => 1.4,
                'cantidad_ejes' => '3',
                'marca_motor' => 'Volvo',
                'modelo_motor' => 'D13',
                'ubicacion_motor' => 'trasero',
                'marca_chasis' => 'Volvo',
                'marca_carroceria' => 'Marcopolo',
                'modelo_carroceria' => 'Paradiso 1200',
                'fecha_adquisicion' => '2021-02-28',
                'estado' => 'operativo',
                'proxima_revision_tecnica' => $fechaReferencia->copy()->addMonths(4),
                'ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(8),
                'vencimiento_soap' => $fechaReferencia->copy()->addMonths(6),
                'numero_soap' => 'SOAP2024005',
                'compania_seguro' => 'Mapfre',
                'numero_poliza' => 'POL2024005',
                'tipo_cobertura_adicional' => 'full',
                'vencimiento_poliza' => $fechaReferencia->copy()->addMonths(8),
                'numero_permiso_circulacion' => 'PC2024005',
                'kilometraje_original' => 54000,
                'proximo_mantenimiento_km' => 10000,
                'fecha_ultimo_mantenimiento' => $fechaReferencia->copy()->subWeeks(2),
                'fecha_proximo_mantenimiento' => $fechaReferencia->copy()->addMonths(3),
                'kilometraje_actual' => 120000,
                'kilometraje_ultimo_cambio_aceite' => 114500,
                'tipo_aceite_motor' => 'sintético',
                'fecha_ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(5),
            ],
            [
                'patente' => 'QRST90',
                'patente_verificador' => '4',
                'marca' => 'Scania',
                'modelo' => 'K380',
                'anio' => 2021,
                'tipo_combustible' => 'diesel',
                'numero_serie' => 'SCN21SC003',
                'numero_motor' => 'DC13SC003',
                'numero_chasis' => 'CH21SC003',
                'capacidad_pasajeros' => 38,
                'tipo_bus' => 'doble_piso',
                'tipo_servicio' => 'semicama',
                'factor_tarifa' => 1.4,
                'cantidad_ejes' => '3',
                'marca_motor' => 'Scania',
                'modelo_motor' => 'DC13',
                'ubicacion_motor' => 'trasero',
                'marca_chasis' => 'Scania',
                'marca_carroceria' => 'Marcopolo',
                'modelo_carroceria' => 'Paradiso 1200',
                'fecha_adquisicion' => '2021-09-12',
                'estado' => 'operativo',
                'proxima_revision_tecnica' => $fechaReferencia->copy()->addMonths(5),
                'ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(7),
                'vencimiento_soap' => $fechaReferencia->copy()->addMonths(8),
                'numero_soap' => 'SOAP2024006',
                'compania_seguro' => 'Liberty Seguros',
                'numero_poliza' => 'POL2024006',
                'tipo_cobertura_adicional' => 'full',
                'vencimiento_poliza' => $fechaReferencia->copy()->addMonths(11),
                'numero_permiso_circulacion' => 'PC2024006',
                'kilometraje_original' => 41000,
                'proximo_mantenimiento_km' => 10000,
                'fecha_ultimo_mantenimiento' => $fechaReferencia->copy()->subWeeks(4),
                'fecha_proximo_mantenimiento' => $fechaReferencia->copy()->addMonths(2),
                'kilometraje_actual' => 120000,
                'kilometraje_ultimo_cambio_aceite' => 114500,
                'tipo_aceite_motor' => 'sintético',
                'fecha_ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(5),
            ],

            // ============================================
            // BUSES CAMA (2 pisos, asientos 180°)
            // Factor tarifa: 2.0x (el doble de la tarifa base)
            // Capacidad: 32 pasajeros
            // ============================================
            [
                'patente' => 'UVWX34',
                'patente_verificador' => '6',
                'marca' => 'Mercedes-Benz',
                'modelo' => 'O-500RS',
                'anio' => 2022,
                'tipo_combustible' => 'diesel',
                'numero_serie' => 'MB22CM001',
                'numero_motor' => 'OM457CM001',
                'numero_chasis' => 'CH22CM001',
                'capacidad_pasajeros' => 32,
                'tipo_bus' => 'doble_piso',
                'tipo_servicio' => 'cama',
                'factor_tarifa' => 2.0,
                'cantidad_ejes' => '3',
                'marca_motor' => 'Mercedes-Benz',
                'modelo_motor' => 'OM-457',
                'ubicacion_motor' => 'trasero',
                'marca_chasis' => 'Mercedes-Benz',
                'marca_carroceria' => 'Marcopolo',
                'modelo_carroceria' => 'Paradiso 1800',
                'fecha_adquisicion' => '2022-04-20',
                'estado' => 'operativo',
                'proxima_revision_tecnica' => $fechaReferencia->copy()->addMonths(6),
                'ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(6),
                'vencimiento_soap' => $fechaReferencia->copy()->addMonths(9),
                'numero_soap' => 'SOAP2024007',
                'compania_seguro' => 'HDI Seguros',
                'numero_poliza' => 'POL2024007',
                'tipo_cobertura_adicional' => 'full',
                'vencimiento_poliza' => $fechaReferencia->copy()->addYear(),
                'numero_permiso_circulacion' => 'PC2024007',
                'kilometraje_original' => 28000,
                'proximo_mantenimiento_km' => 10000,
                'fecha_ultimo_mantenimiento' => $fechaReferencia->copy()->subWeeks(1),
                'fecha_proximo_mantenimiento' => $fechaReferencia->copy()->addMonths(3),
                'kilometraje_actual' => 120000,
                'kilometraje_ultimo_cambio_aceite' => 114500,
                'tipo_aceite_motor' => 'sintético',
                'fecha_ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(5),
            ],
            [
                'patente' => 'YZAB56',
                'patente_verificador' => '8',
                'marca' => 'Volvo',
                'modelo' => 'B340M',
                'anio' => 2022,
                'tipo_combustible' => 'diesel',
                'numero_serie' => 'VLV22CM002',
                'numero_motor' => 'D13CM002',
                'numero_chasis' => 'CH22CM002',
                'capacidad_pasajeros' => 32,
                'tipo_bus' => 'doble_piso',
                'tipo_servicio' => 'cama',
                'factor_tarifa' => 2.0,
                'cantidad_ejes' => '3',
                'marca_motor' => 'Volvo',
                'modelo_motor' => 'D13',
                'ubicacion_motor' => 'trasero',
                'marca_chasis' => 'Volvo',
                'marca_carroceria' => 'Marcopolo',
                'modelo_carroceria' => 'Paradiso 1800',
                'fecha_adquisicion' => '2022-10-15',
                'estado' => 'operativo',
                'proxima_revision_tecnica' => $fechaReferencia->copy()->addMonths(7),
                'ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(5),
                'vencimiento_soap' => $fechaReferencia->copy()->addMonths(10),
                'numero_soap' => 'SOAP2024008',
                'compania_seguro' => 'Mapfre',
                'numero_poliza' => 'POL2024008',
                'tipo_cobertura_adicional' => 'full',
                'vencimiento_poliza' => $fechaReferencia->copy()->addYear(),
                'numero_permiso_circulacion' => 'PC2024008',
                'kilometraje_original' => 15000,
                'proximo_mantenimiento_km' => 10000,
                'fecha_ultimo_mantenimiento' => $fechaReferencia->copy()->subDays(10),
                'fecha_proximo_mantenimiento' => $fechaReferencia->copy()->addMonths(3),
                'kilometraje_actual' => 120000,
                'kilometraje_ultimo_cambio_aceite' => 114500,
                'tipo_aceite_motor' => 'sintético',
                'fecha_ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(5),
            ],

            // ============================================
            // BUSES PREMIUM (2 pisos, servicio lujo)
            // Factor tarifa: 3.0x (triple de la tarifa base)
            // Capacidad: 20 pasajeros
            // ============================================
            [
                'patente' => 'CDEF78',
                'patente_verificador' => '9',
                'marca' => 'Mercedes-Benz',
                'modelo' => 'O-500RS',
                'anio' => 2023,
                'tipo_combustible' => 'diesel',
                'numero_serie' => 'MB23PR001',
                'numero_motor' => 'OM457PR001',
                'numero_chasis' => 'CH23PR001',
                'capacidad_pasajeros' => 20,
                'tipo_bus' => 'doble_piso',
                'tipo_servicio' => 'premium',
                'factor_tarifa' => 3.0,
                'cantidad_ejes' => '3',
                'marca_motor' => 'Mercedes-Benz',
                'modelo_motor' => 'OM-457',
                'ubicacion_motor' => 'trasero',
                'marca_chasis' => 'Mercedes-Benz',
                'marca_carroceria' => 'Marcopolo',
                'modelo_carroceria' => 'Paradiso 1800',
                'fecha_adquisicion' => '2023-05-30',
                'estado' => 'operativo',
                'proxima_revision_tecnica' => $fechaReferencia->copy()->addMonths(8),
                'ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(4),
                'vencimiento_soap' => $fechaReferencia->copy()->addMonths(11),
                'numero_soap' => 'SOAP2024009',
                'compania_seguro' => 'HDI Seguros',
                'numero_poliza' => 'POL2024009',
                'tipo_cobertura_adicional' => 'full',
                'vencimiento_poliza' => $fechaReferencia->copy()->addMonths(13),
                'numero_permiso_circulacion' => 'PC2024009',
                'kilometraje_original' => 8200,
                'proximo_mantenimiento_km' => 10000,
                'fecha_ultimo_mantenimiento' => $fechaReferencia->copy()->subWeeks(2),
                'fecha_proximo_mantenimiento' => $fechaReferencia->copy()->addMonths(4),
                'kilometraje_actual' => 120000,
                'kilometraje_ultimo_cambio_aceite' => 114500,
                'tipo_aceite_motor' => 'sintético',
                'fecha_ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(5),
            ],
            [
                'patente' => 'GHIJ01',
                'patente_verificador' => 'K',
                'marca' => 'Volvo',
                'modelo' => 'B340M',
                'anio' => 2023,
                'tipo_combustible' => 'diesel',
                'numero_serie' => 'VLV23PR002',
                'numero_motor' => 'D13PR002',
                'numero_chasis' => 'CH23PR002',
                'capacidad_pasajeros' => 20,
                'tipo_bus' => 'doble_piso',
                'tipo_servicio' => 'premium',
                'factor_tarifa' => 3.0,
                'cantidad_ejes' => '3',
                'marca_motor' => 'Volvo',
                'modelo_motor' => 'D13',
                'ubicacion_motor' => 'trasero',
                'marca_chasis' => 'Volvo',
                'marca_carroceria' => 'Marcopolo',
                'modelo_carroceria' => 'Paradiso 1800',
                'fecha_adquisicion' => '2023-11-25',
                'estado' => 'operativo',
                'proxima_revision_tecnica' => $fechaReferencia->copy()->addMonths(9),
                'ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(3),
                'vencimiento_soap' => $fechaReferencia->copy()->addYear(),
                'numero_soap' => 'SOAP2024010',
                'compania_seguro' => 'Liberty Seguros',
                'numero_poliza' => 'POL2024010',
                'tipo_cobertura_adicional' => 'full',
                'vencimiento_poliza' => $fechaReferencia->copy()->addMonths(14),
                'numero_permiso_circulacion' => 'PC2024010',
                'kilometraje_original' => 3200,
                'proximo_mantenimiento_km' => 10000,
                'fecha_ultimo_mantenimiento' => $fechaReferencia->copy()->subDays(2),
                'fecha_proximo_mantenimiento' => $fechaReferencia->copy()->addMonths(4),
                'kilometraje_actual' => 120000,
                'kilometraje_ultimo_cambio_aceite' => 114500,
                'tipo_aceite_motor' => 'sintético',
                'fecha_ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(5),
            ],

            // ============================================
            // BUSES ADICIONALES (mix para tener variedad)
            // ============================================
            [
                'patente' => 'KLMN23',
                'patente_verificador' => '0',
                'marca' => 'Scania',
                'modelo' => 'K340',
                'anio' => 2019,
                'tipo_combustible' => 'diesel',
                'numero_serie' => 'SCN19CL004',
                'numero_motor' => 'DC13CL004',
                'numero_chasis' => 'CH19CL004',
                'capacidad_pasajeros' => 45,
                'tipo_bus' => 'simple',
                'tipo_servicio' => 'clasico',
                'factor_tarifa' => 1.0,
                'cantidad_ejes' => '2',
                'marca_motor' => 'Scania',
                'modelo_motor' => 'DC13',
                'ubicacion_motor' => 'trasero',
                'marca_chasis' => 'Scania',
                'marca_carroceria' => 'Metalpar',
                'modelo_carroceria' => 'Pucará',
                'fecha_adquisicion' => '2019-11-05',
                'estado' => 'operativo',
                'proxima_revision_tecnica' => $fechaReferencia->copy()->addMonths(2),
                'ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(10),
                'vencimiento_soap' => $fechaReferencia->copy()->addMonths(4),
                'numero_soap' => 'SOAP2024011',
                'compania_seguro' => 'Mapfre',
                'numero_poliza' => 'POL2024011',
                'tipo_cobertura_adicional' => 'terceros',
                'vencimiento_poliza' => $fechaReferencia->copy()->addMonths(6),
                'numero_permiso_circulacion' => 'PC2024011',
                'kilometraje_original' => 112000,
                'proximo_mantenimiento_km' => 10000,
                'fecha_ultimo_mantenimiento' => $fechaReferencia->copy()->subMonths(3),
                'fecha_proximo_mantenimiento' => $fechaReferencia->copy()->addWeeks(2),
                'kilometraje_actual' => 120000,
                'kilometraje_ultimo_cambio_aceite' => 114500,
                'tipo_aceite_motor' => 'sintético',
                'fecha_ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(5),
            ],
            [
                'patente' => 'OPQR45',
                'patente_verificador' => '2',
                'marca' => 'Mercedes-Benz',
                'modelo' => 'O-500R',
                'anio' => 2021,
                'tipo_combustible' => 'diesel',
                'numero_serie' => 'MB21SC004',
                'numero_motor' => 'OM457SC004',
                'numero_chasis' => 'CH21SC004',
                'capacidad_pasajeros' => 38,
                'tipo_bus' => 'doble_piso',
                'tipo_servicio' => 'semicama',
                'factor_tarifa' => 1.4,
                'cantidad_ejes' => '3',
                'marca_motor' => 'Mercedes-Benz',
                'modelo_motor' => 'OM-457',
                'ubicacion_motor' => 'trasero',
                'marca_chasis' => 'Mercedes-Benz',
                'marca_carroceria' => 'Marcopolo',
                'modelo_carroceria' => 'Paradiso 1200',
                'fecha_adquisicion' => '2021-07-18',
                'estado' => 'operativo',
                'proxima_revision_tecnica' => $fechaReferencia->copy()->addMonths(3),
                'ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(9),
                'vencimiento_soap' => $fechaReferencia->copy()->addMonths(7),
                'numero_soap' => 'SOAP2024012',
                'compania_seguro' => 'HDI Seguros',
                'numero_poliza' => 'POL2024012',
                'tipo_cobertura_adicional' => 'full',
                'vencimiento_poliza' => $fechaReferencia->copy()->addMonths(9),
                'numero_permiso_circulacion' => 'PC2024012',
                'kilometraje_original' => 62000,
                'proximo_mantenimiento_km' => 10000,
                'fecha_ultimo_mantenimiento' => $fechaReferencia->copy()->subMonths(2),
                'fecha_proximo_mantenimiento' => $fechaReferencia->copy()->addMonths(1),
                'kilometraje_actual' => 120000,
                'kilometraje_ultimo_cambio_aceite' => 114500,
                'tipo_aceite_motor' => 'sintético',
                'fecha_ultima_revision_tecnica' => $fechaReferencia->copy()->subMonths(5),
            ],
        ];

        // Crear los 12 buses estáticos
        foreach ($buses as $busData) {
            $alertaAceite = $busData['alerta_mantenimiento'] ?? null;
            unset($busData['alerta_mantenimiento']);
            $bus = Bus::create($busData);
            if ($alertaAceite) {
                $bus->update($alertaAceite);
            }
        }

        // ============================================
        // 2. GENERACIÓN AUTOMÁTICA DE 28 BUSES MÁS
        // ============================================
        $totalBusesDeseados = 40;
        $busesCreados = count($buses);

        $marcas = [
            ['marca' => 'Mercedes-Benz', 'modelo' => 'O-500R', 'motor' => 'OM-457', 'chasis' => 'Mercedes-Benz'],
            ['marca' => 'Volvo', 'modelo' => 'B450R', 'motor' => 'D13C', 'chasis' => 'Volvo'],
            ['marca' => 'Scania', 'modelo' => 'K440', 'motor' => 'DC13', 'chasis' => 'Scania'],
            ['marca' => 'MAN', 'modelo' => 'Lion’s Coach', 'motor' => 'D2676', 'chasis' => 'MAN'],
        ];

        $carrocerias = [
            ['marca' => 'Marcopolo', 'modelo' => 'Paradiso 1800 DD'],
            ['marca' => 'Irizar', 'modelo' => 'i6'],
            ['marca' => 'Busscar', 'modelo' => 'Vissta Buss DD'],
        ];

        // CONFIGURACIÓN DE CAPACIDADES VARIADAS
        $tiposServicio = [
            ['tipo' => 'clasico', 'capacidad' => 46, 'factor' => 1.0, 'tipo_bus' => 'simple'],       // Simple -> 46
            ['tipo' => 'semicama', 'capacidad' => 60, 'factor' => 1.4, 'tipo_bus' => 'doble_piso'],  // Doble (Alto) -> 60
            ['tipo' => 'cama', 'capacidad' => 42, 'factor' => 2.0, 'tipo_bus' => 'doble_piso'],      // Doble (Medio) -> 42
            ['tipo' => 'premium', 'capacidad' => 24, 'factor' => 3.0, 'tipo_bus' => 'doble_piso'],   // Doble (Bajo) -> 24
        ];

        $letras = range('A', 'Z');

        for ($i = $busesCreados + 1; $i <= $totalBusesDeseados; $i++) {
            // Generar patente aleatoria 4 letras 2 numeros (formato nuevo CL)
            $patente = $letras[array_rand($letras)] . $letras[array_rand($letras)] .
                       $letras[array_rand($letras)] . $letras[array_rand($letras)] .
                       rand(10, 99);

            $dv = rand(0, 9);
            if (rand(0, 10) > 8) {
                $dv = 'K'; // A veces K
            }

            // Selección aleatoria de configuración
            $marcaData = $marcas[array_rand($marcas)];
            $carroceriaData = $carrocerias[array_rand($carrocerias)];
            $servicioData = $tiposServicio[array_rand($tiposServicio)];

            // Fechas seguras (siempre futuras para vencimientos)
            $vencimientoSoap = $fechaReferencia->copy()->addMonths(rand(3, 12));
            $vencimientoRev = $fechaReferencia->copy()->addMonths(rand(2, 8));

            $kilometrajeActual = rand(50000, 220000);
            $deltaKm = rand(3000, 9000);
            $tipoAceite = ['convencional', 'sintético'][rand(0, 1)];
            $mesesRevision = rand(2, 6);

            $bus = Bus::create([
                'patente' => $patente,
                'patente_verificador' => (string)$dv,
                'marca' => $marcaData['marca'],
                'modelo' => $marcaData['modelo'],
                'anio' => rand(2018, 2024),
                'tipo_combustible' => 'diesel',
                'numero_serie' => strtoupper(substr($marcaData['marca'], 0, 3)) . rand(1000, 9999),
                'numero_motor' => $marcaData['motor'] . rand(10000, 99999),
                'numero_chasis' => 'CH' . rand(100000, 999999),
                'capacidad_pasajeros' => $servicioData['capacidad'],
                'tipo_bus' => $servicioData['tipo_bus'],
                'tipo_servicio' => $servicioData['tipo'],
                'factor_tarifa' => $servicioData['factor'],
                'cantidad_ejes' => $servicioData['tipo_bus'] === 'doble_piso' ? '3' : '2',
                'marca_motor' => $marcaData['marca'],
                'modelo_motor' => $marcaData['motor'],
                'ubicacion_motor' => 'trasero',
                'marca_chasis' => $marcaData['chasis'],
                'marca_carroceria' => $carroceriaData['marca'],
                'modelo_carroceria' => $carroceriaData['modelo'],
                'fecha_adquisicion' => $fechaReferencia->copy()->subMonths(rand(6, 48))->format('Y-m-d'),
                'estado' => 'operativo',

                // Fechas
                'proxima_revision_tecnica' => $vencimientoRev,
                'ultima_revision_tecnica' => $vencimientoRev->copy()->subYear(),
                'vencimiento_soap' => $vencimientoSoap,
                'numero_soap' => 'SOAP2025-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'compania_seguro' => ['HDI', 'Mapfre', 'Liberty', 'Sura'][rand(0, 3)],
                'numero_poliza' => 'POL-' . rand(100000, 999999),
                'tipo_cobertura_adicional' => rand(0, 1) ? 'full' : 'terceros',
                'vencimiento_poliza' => $vencimientoSoap->copy()->addMonth(),
                'numero_permiso_circulacion' => 'PC-' . rand(10000, 99999),

                'kilometraje_original' => rand(10000, 300000),
                'proximo_mantenimiento_km' => 10000,
                'fecha_ultimo_mantenimiento' => $fechaReferencia->copy()->subDays(rand(5, 60)),
                'fecha_proximo_mantenimiento' => $fechaReferencia->copy()->addMonths(rand(1, 3)),
            ]);

            $bus->update($this->construirAlertaAceite($fechaReferencia, $kilometrajeActual, $deltaKm, $mesesRevision, $tipoAceite));
        }

        $this->command->info("✅ {$totalBusesDeseados} buses creados (12 estáticos + 28 generados) con documentos vigentes al 08/12/2025.");
    }

    private function construirAlertaAceite(Carbon $referencia, int $kilometrajeActual, int $deltaKm, int $mesesRevision, string $tipo = 'convencional'): array
    {
        return [
            'kilometraje_actual' => $kilometrajeActual,
            'kilometraje_ultimo_cambio_aceite' => max(0, $kilometrajeActual - $deltaKm),
            'tipo_aceite_motor' => $tipo,
            'fecha_ultima_revision_tecnica' => $referencia->copy()->subMonths($mesesRevision)->format('Y-m-d'),
        ];
    }

}
