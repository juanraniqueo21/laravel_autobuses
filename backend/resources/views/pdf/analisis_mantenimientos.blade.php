<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Análisis de Mantenimientos</title>
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

        /* KPIs forzados en una línea con Tabla */
        .kpi-wrapper { width: 100%; margin-bottom: 20px; border-collapse: separate; border-spacing: 10px 0; margin-left: -10px; }
        .kpi-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px;
            text-align: left;
            vertical-align: top;
            width: 25%; /* 4 tarjetas = 25% cada una */
        }
        .kpi-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: bold; display: block; margin-bottom: 5px; }
        .kpi-value { font-size: 18px; font-weight: bold; color: #0f172a; display: block; }
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
        
        /* Badges de Estado */
        .badge { padding: 3px 8px; border-radius: 99px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
        .badge-taller { background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .badge-operativo { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

        .notes-section {
            margin-top: 20px;
            border: 1px dashed #cbd5e1;
            padding: 10px;
            font-size: 10px;
            color: #64748b;
            background-color: #f8fafc;
        }
    </style>
</head>
<body>
    @php
        use Carbon\Carbon;
        $mesNombre = '-';
        if (!empty($filtros['mes']) && !empty($filtros['anio'])) {
            $mesNombre = Carbon::createFromDate($filtros['anio'], $filtros['mes'], 1)->locale('es')->isoFormat('MMMM');
        } elseif (!empty($comparativa['periodo_actual'])) {
            $mesNombre = $comparativa['periodo_actual'];
        }
        $topCostos = collect($analisis)->sortByDesc('costo_total_mantenimientos')->take(3);
        $serviciosResumen = collect($analisis)
            ->groupBy('tipo_servicio')
            ->map(fn ($items) => [
                'cantidad' => $items->sum('total_mantenimientos'),
                'costo' => $items->sum('costo_total_mantenimientos'),
            ]);
    @endphp

    <table class="header-table">
        <tr>
            <td style="vertical-align: bottom;">
                <div class="company-name">ConectaFlota</div>
                <div style="font-size: 10px; color: #64748b;">Departamento de Mantenimiento</div>
            </td>
            <td style="vertical-align: bottom;">
                <div class="doc-title">ANÁLISIS DE MANTENIMIENTOS</div>
                <div class="doc-meta">PERÍODO: {{ strtoupper($mesNombre) }} {{ $filtros['anio'] ?? '' }}</div>
                <div class="doc-meta">FILTRO: {{ strtoupper($filtros['tipo_mantenimiento'] ?? 'TODOS') }}</div>
            </td>
        </tr>
    </table>

    @php
        $totales = (array) ($resumenTotales ?? (object) [
          'total_mantenimientos' => 0,
          'total_costos' => 0,
          'preventivos' => 0,
          'correctivos' => 0,
          'en_proceso' => 0,
        ]);
    @endphp

    <div class="section-title">Resumen Ejecutivo</div>
    <table class="kpi-wrapper">
        <tr>
            <td class="kpi-box">
                <span class="kpi-label">Total Eventos</span>
                <span class="kpi-value">{{ number_format($totales['total_mantenimientos'] ?? 0, 0, ',', '.') }}</span>
                <span class="kpi-sub">{{ $comparativa['total_anterior'] ?? 0 }} mes anterior</span>
            </td>
            <td class="kpi-box">
                <span class="kpi-label">Costo Total</span>
                <span class="kpi-value">${{ number_format($totales['total_costos'] ?? 0, 0, ',', '.') }}</span>
                <span class="kpi-sub">Prom. ${{ number_format($resumen['costo_promedio'] ?? 0, 0, ',', '.') }}</span>
            </td>
            <td class="kpi-box">
                <span class="kpi-label">Prev. / Corr.</span>
                <span class="kpi-value">{{ $totales['preventivos'] }} / {{ $totales['correctivos'] }}</span>
                <span class="kpi-sub">Ratio: {{ $resumen['porcentaje_preventivos'] ?? 0 }}% Prev.</span>
            </td>
            <td class="kpi-box" style="background-color: #fff7ed; border-color: #fed7aa;">
                <span class="kpi-label" style="color: #c2410c;">En Taller</span>
                <span class="kpi-value" style="color: #ea580c;">{{ $totales['en_proceso'] ?? 0 }}</span>
                <span class="kpi-sub" style="color: #9a3412;">Unidades Activas</span>
            </td>
        </tr>
    </table>

    <div class="section-title">Mayores Costos Operativos (Top 3)</div>
    <table class="details-table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 20%;">Patente</th>
                <th style="width: 25%;">Servicio</th>
                <th style="width: 25%;">Detalle</th>
                <th class="text-right">Costo Acumulado</th>
            </tr>
        </thead>
        <tbody>
            @forelse($topCostos as $item)
                <tr>
                    <td>{{ $loop->iteration }}</td>
                    <td class="font-bold">{{ $item['patente'] ?? 'N/A' }}</td>
                    <td>{{ $item['tipo_servicio'] ?? 'N/A' }}</td>
                    <td style="color: #64748b;">{{ $item['total_mantenimientos'] ?? 0 }} eventos</td>
                    <td class="text-right font-bold" style="color: #ea580c;">
                        ${{ number_format($item['costo_total_mantenimientos'] ?? 0, 0, ',', '.') }}
                    </td>
                </tr>
            @empty
                <tr><td colspan="5" class="text-center">Sin datos suficientes.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title" style="margin-top: 25px;">Distribución por Tipo de Servicio</div>
    <table class="details-table">
        <thead>
            <tr>
                <th>Tipo Servicio</th>
                <th class="text-center">Cantidad Eventos</th>
                <th class="text-right">Inversión Total</th>
            </tr>
        </thead>
        <tbody>
            @forelse($serviciosResumen as $servicio => $meta)
                <tr>
                    <td style="text-transform: uppercase;">{{ ucfirst($servicio) }}</td>
                    <td class="text-center">{{ $meta['cantidad'] }}</td>
                    <td class="text-right">${{ number_format($meta['costo'], 0, ',', '.') }}</td>
                </tr>
            @empty
                <tr><td colspan="3" class="text-center">Sin datos.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title" style="margin-top: 25px;">Detalle General de Flota</div>
    <table class="details-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Patente</th>
                <th>Servicio</th>
                <th>Tipo</th>
                <th class="text-center">Total</th>
                <th class="text-center">Prev.</th>
                <th class="text-center">Corr.</th>
                <th class="text-center">Estado</th> <th class="text-right">Costo Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($analisis as $item)
                <tr>
                    <td>{{ $loop->iteration }}</td>
                    <td>{{ $item['patente'] }}</td>
                    <td>{{ $item['tipo_servicio'] }}</td>
                    <td>{{ $item['estado_bus'] }}</td>
                    <td class="text-center">{{ $item['total_mantenimientos'] }}</td>
                    <td class="text-center">{{ $item['preventivos'] }}</td>
                    <td class="text-center">{{ $item['correctivos'] }}</td>
                    <td class="text-center">
                        @if(($item['en_proceso'] ?? 0) > 0)
                            <span class="badge badge-taller">EN TALLER</span>
                        @else
                            <span class="badge badge-operativo">OPERATIVO</span>
                        @endif
                    </td>
                    <td class="text-right">${{ number_format($item['costo_total_mantenimientos'] ?? 0, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="notes-section">
        <strong>Resumen Comparativo:</strong>
        <ul style="margin-top: 5px; padding-left: 15px; margin-bottom: 0;">
            <li>Total Mantenimientos: {{ number_format($comparativa['total_actual'] ?? 0, 0, ',', '.') }} (vs {{ number_format($comparativa['total_anterior'] ?? 0, 0, ',', '.') }} mes anterior).</li>
            <li>Costo Acumulado: ${{ number_format($comparativa['costo_actual'] ?? 0, 0, ',', '.') }} (vs ${{ number_format($comparativa['costo_anterior'] ?? 0, 0, ',', '.') }} mes anterior).</li>
            @foreach($notas as $nota)
                <li>{{ $nota }}</li>
            @endforeach
        </ul>
    </div>

    <div style="margin-top: 40px; border-top: 1px solid #0f172a; padding-top: 10px; text-align: center; font-size: 9px; color: #64748b;">
        Reporte generado automáticamente por ConectaFlota el {{ now()->format('d/m/Y H:i') }}
    </div>

</body>
</html>
