<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Análisis de servicio mensual</title>
    <style>
        @page { margin: 30px; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px;
            color: #334155;
            line-height: 1.4;
            margin: 0;
        }

        /* Encabezado */
        .header-table { width: 100%; margin-bottom: 25px; border-bottom: 2px solid #ea580c; padding-bottom: 10px; }
        .company-name { font-size: 22px; font-weight: bold; color: #0f172a; }
        .doc-title { font-size: 18px; color: #ea580c; font-weight: bold; text-align: right; text-transform: uppercase; }
        .doc-meta { font-size: 10px; color: #64748b; text-align: right; }

        /* Títulos */
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
            border-bottom: 1px solid #94a3b8;
            margin-bottom: 10px;
            padding-bottom: 2px;
            text-transform: uppercase;
            margin-top: 20px;
        }

        /* KPIs */
        .kpi-wrapper { width: 100%; margin-bottom: 10px; border-collapse: separate; border-spacing: 10px 0; margin-left: -10px; }
        .kpi-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px;
            text-align: left;
            vertical-align: top;
            width: 33.33%;
        }
        .kpi-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: bold; display: block; margin-bottom: 5px; }
        .kpi-value { font-size: 16px; font-weight: bold; color: #0f172a; display: block; }
        .kpi-sub { font-size: 9px; color: #ea580c; margin-top: 4px; display: block; }

        /* Tablas de Datos */
        .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .details-table th {
            background-color: #f1f5f9;
            color: #1e293b;
            padding: 8px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            border-bottom: 2px solid #cbd5e1;
        }
        .details-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10px;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        
        .footer-note { font-size: 9px; color: #64748b; margin-top: 10px; font-style: italic; }
    </style>
</head>
<body>
    @php
        use Carbon\Carbon;
        $mesNombre = '-';
        if (!empty($filtros['mes']) && !empty($filtros['anio'])) {
            $mesNombre = ucfirst(Carbon::createFromDate($filtros['anio'], $filtros['mes'], 1)->locale('es')->isoFormat('MMMM'));
        } elseif ($filtros['fecha_inicio'] && $filtros['fecha_fin']) {
            $mesNombre = Carbon::parse($filtros['fecha_inicio'])->format('d/m/Y') . ' a ' . Carbon::parse($filtros['fecha_fin'])->format('d/m/Y');
        }
        $rentabilidadCollection = collect($rentabilidad);
        $ocupacionCollection = collect($ocupacion);
    @endphp

    <table class="header-table">
        <tr>
            <td style="vertical-align: bottom;">
                <div class="company-name">ConectaFlota</div>
                <div style="font-size: 10px; color: #64748b;">Departamento de Operaciones</div>
            </td>
            <td style="vertical-align: bottom;">
                <div class="doc-title">ANÁLISIS DE SERVICIO</div>
                <div class="doc-meta">PERÍODO: {{ strtoupper($mesNombre) }} {{ $filtros['anio'] ?? '' }}</div>
                <div class="doc-meta">GENERADO: {{ Carbon::now()->locale('es')->isoFormat('LL') }}</div>
            </td>
        </tr>
    </table>

    <div class="section-title">Resumen Financiero</div>
    <table class="kpi-wrapper">
        <tr>
            <td class="kpi-box">
                <span class="kpi-label">Ingresos Totales</span>
                <span class="kpi-value">${{ number_format($resumen['total_ingresos'] ?? 0, 0, ',', '.') }}</span>
                <span class="kpi-sub" style="color: #166534;">Ventas del periodo</span>
            </td>
            <td class="kpi-box">
                <span class="kpi-label">Gastos Totales</span>
                <span class="kpi-value">${{ number_format($resumen['total_gastos'] ?? 0, 0, ',', '.') }}</span>
                <span class="kpi-sub" style="color: #991b1b;">Operativos + Peajes</span>
            </td>
            <td class="kpi-box" style="background-color: #fff7ed; border-color: #fed7aa;">
                <span class="kpi-label" style="color: #c2410c;">Ganancia Neta</span>
                <span class="kpi-value" style="color: #ea580c;">${{ number_format($resumen['ganancia_neta'] ?? 0, 0, ',', '.') }}</span>
                <span class="kpi-sub" style="color: #9a3412;">{{ number_format($resumen['margen_porcentaje'] ?? 0, 2, ',', '.') }}% Margen</span>
            </td>
        </tr>
    </table>

    <table class="kpi-wrapper" style="margin-top: 5px;">
        <tr>
            <td class="kpi-box">
                <span class="kpi-label">Viajes con Alerta</span>
                <span class="kpi-value">{{ $resumen['viajes_con_alerta'] ?? 0 }}</span>
                <span class="kpi-sub">Dif. > 10%</span>
            </td>
            <td class="kpi-box">
                <span class="kpi-label">Viajes Deficitarios</span>
                <span class="kpi-value">{{ $resumen['viajes_deficitarios'] ?? 0 }}</span>
                <span class="kpi-sub">Costo > Ingreso</span>
            </td>
            <td class="kpi-box">
                <span class="kpi-label">Pérdidas Acumuladas</span>
                <span class="kpi-value" style="color: #ef4444;">${{ number_format($resumen['perdida_total_deficitarios'] ?? 0, 0, ',', '.') }}</span>
                <span class="kpi-sub">En viajes deficitarios</span>
            </td>
        </tr>
    </table>

    <div class="section-title">Rentabilidad por Tipo de Servicio</div>
    @if($rentabilidadCollection->isEmpty())
        <p class="footer-note">No hay datos para mostrar.</p>
    @else
        <table class="details-table">
            <thead>
                <tr>
                    <th>Tipo</th>
                    <th class="text-center">Viajes</th>
                    <th class="text-center">Pasajeros</th>
                    <th class="text-right">Ingresos</th>
                    <th class="text-right">Gastos</th>
                    <th class="text-right">Ganancia</th>
                    <th class="text-right">Margen %</th>
                    <th class="text-center">Cap. Prom</th>
                </tr>
            </thead>
            <tbody>
                @foreach($rentabilidadCollection as $item)
                    <tr>
                        <td class="font-bold">{{ $item['tipo_servicio'] }}</td>
                        <td class="text-center">{{ number_format($item['total_viajes'], 0, ',', '.') }}</td>
                        <td class="text-center">{{ number_format($item['total_pasajeros'], 0, ',', '.') }}</td>
                        <td class="text-right">${{ number_format($item['total_ingresos'], 0, ',', '.') }}</td>
                        <td class="text-right">${{ number_format($item['total_gastos'], 0, ',', '.') }}</td>
                        <td class="text-right font-bold" style="color: {{ $item['ganancia_neta'] >= 0 ? '#166534' : '#991b1b' }}">
                            ${{ number_format($item['ganancia_neta'], 0, ',', '.') }}
                        </td>
                        <td class="text-right">{{ number_format($item['margen_porcentaje'], 2, ',', '.') }}%</td>
                        <td class="text-center">{{ number_format($item['capacidad_promedio'], 1, ',', '.') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="section-title" style="margin-top: 25px;">Ocupación por Tipo de Servicio</div>
    @if($ocupacionCollection->isEmpty())
        <p class="footer-note">No hay datos de ocupación.</p>
    @else
        <table class="details-table">
            <thead>
                <tr>
                    <th>Tipo</th>
                    <th class="text-center">Viajes</th>
                    <th class="text-center">Ocup. Prom</th>
                    <th class="text-center">Ocup. Max</th>
                    <th class="text-center">Ocup. Min</th>
                    <th class="text-center">Pax Prom</th>
                    <th class="text-center">Cap. Prom</th>
                </tr>
            </thead>
            <tbody>
                @foreach($ocupacionCollection as $item)
                    <tr>
                        <td class="font-bold">{{ $item['tipo_servicio'] }}</td>
                        <td class="text-center">{{ number_format($item['total_viajes'], 0, ',', '.') }}</td>
                        <td class="text-center">{{ number_format($item['tasa_ocupacion_promedio'], 1, ',', '.') }}%</td>
                        <td class="text-center">{{ number_format($item['tasa_ocupacion_maxima'], 1, ',', '.') }}%</td>
                        <td class="text-center">{{ number_format($item['tasa_ocupacion_minima'], 1, ',', '.') }}%</td>
                        <td class="text-center">{{ number_format($item['pasajeros_promedio'], 1, ',', '.') }}</td>
                        <td class="text-center">{{ number_format($item['capacidad_promedio'], 1, ',', '.') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div style="margin-top: 40px; border-top: 1px solid #0f172a; padding-top: 10px; text-align: center; font-size: 9px; color: #64748b;">
        Todos los montos están representados en pesos chilenos (CLP) y se calculan a partir de los viajes completados. <br>
        Reporte generado automáticamente por ConectaFlota.
    </div>
</body>
</html>