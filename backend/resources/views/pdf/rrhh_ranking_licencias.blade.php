<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Ranking de Licencias RRHH</title>
    <style>
        @page { margin: 30px; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px;
            color: #334155;
            line-height: 1.4;
        }

        /* Encabezado */
        .header-table { width: 100%; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        .company-name { font-size: 20px; font-weight: bold; color: #0f172a; }
        .doc-title { font-size: 16px; color: #2563eb; font-weight: bold; text-align: right; text-transform: uppercase; }
        .doc-meta { font-size: 10px; color: #64748b; text-align: right; }

        /* Secciones */
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
            border-bottom: 1px solid #94a3b8;
            margin-top: 20px;
            margin-bottom: 10px;
            padding-bottom: 4px;
            text-transform: uppercase;
        }

        /* KPIs */
        .kpi-table { width: 100%; border-collapse: separate; border-spacing: 4px; margin-bottom: 15px; }
        .kpi-cell { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 4px; 
            padding: 8px; 
            text-align: center; 
            width: 25%;
        }
        .kpi-label { font-size: 9px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
        .kpi-value { font-size: 16px; font-weight: bold; color: #0f172a; display: block; }
        .kpi-hint { font-size: 9px; color: #2563eb; margin-top: 2px; }

        /* Tablas */
        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .details-table th {
            background-color: #f1f5f9;
            color: #1e293b;
            padding: 6px 8px;
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

        /* Alertas */
        .alert-box {
            background-color: #fef2f2;
            border-left: 3px solid #ef4444;
            padding: 8px 12px;
            margin-bottom: 5px;
            font-size: 10px;
            color: #7f1d1d;
        }

        /* Badges */
        .badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
        .badge-danger { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .badge-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    </style>
</head>
<body>
    @php
        use Carbon\Carbon;
        $mesNombre = '-';
        if (!empty($filtros['mes']) && !empty($filtros['anio'])) {
            $mesNombre = Carbon::createFromDate($filtros['anio'], $filtros['mes'], 1)->locale('es')->isoFormat('MMMM');
        }
        $topEmpleados = collect($ranking)->sortByDesc('total_dias_licencia')->take(5);
    @endphp

    <table class="header-table">
        <tr>
            <td style="vertical-align: bottom;">
                <div class="company-name">ConectaFlota</div>
                <div style="font-size: 10px; color: #64748b;">Recursos Humanos</div>
            </td>
            <td style="vertical-align: bottom;">
                <div class="doc-title">INFORME DE AUSENTISMO</div>
                <div class="doc-meta">PERÍODO: {{ ucfirst($mesNombre) }} {{ $filtros['anio'] ?? '' }}</div>
                <div class="doc-meta">EMISIÓN: {{ now()->format('d/m/Y') }}</div>
            </td>
        </tr>
    </table>

    <table class="kpi-table">
        <tr>
            <td class="kpi-cell">
                <span class="kpi-label">Licencias Totales</span>
                <span class="kpi-value">{{ number_format($resumen['total_licencias'] ?? 0, 0, ',', '.') }}</span>
                <span class="kpi-hint">{{ $comparativa['licencias_actual'] > 0 ? '+' : '' }}{{ $comparativa['licencias_actual'] }} vs mes anterior</span>
            </td>
            <td class="kpi-cell">
                <span class="kpi-label">Días Perdidos</span>
                <span class="kpi-value">{{ number_format($resumen['total_dias'] ?? 0, 0, ',', '.') }}</span>
                <span class="kpi-hint">Días hábiles calculados</span>
            </td>
            <td class="kpi-cell">
                <span class="kpi-label">Licencias Médicas</span>
                <span class="kpi-value">{{ number_format($resumen['medicas'] ?? 0, 0, ',', '.') }}</span>
                <span class="kpi-hint">Mayor incidencia</span>
            </td>
            <td class="kpi-cell">
                <span class="kpi-label">Otros Permisos</span>
                <span class="kpi-value">{{ number_format(($resumen['administrativas'] ?? 0) + ($resumen['permisos'] ?? 0), 0, ',', '.') }}</span>
            </td>
        </tr>
    </table>

    <div class="section-title">Comparativa Mensual</div>
    <table class="details-table">
        <thead>
            <tr>
                <th style="width: 30%;">Indicador</th>
                <th class="text-right">Mes Anterior ({{ $comparativa['periodo_anterior'] ?? '-' }})</th>
                <th class="text-right">Mes Actual ({{ $comparativa['periodo_actual'] ?? '-' }})</th>
                <th class="text-right">Variación</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Cantidad de Licencias</td>
                <td class="text-right">{{ number_format($comparativa['licencias_anterior'] ?? 0, 0, ',', '.') }}</td>
                <td class="text-right font-bold">{{ number_format($comparativa['licencias_actual'] ?? 0, 0, ',', '.') }}</td>
                <td class="text-right">
                    @php $diffLic = ($comparativa['licencias_actual'] ?? 0) - ($comparativa['licencias_anterior'] ?? 0); @endphp
                    <span style="color: {{ $diffLic > 0 ? '#dc2626' : '#166534' }}; font-weight: bold;">
                        {{ $diffLic > 0 ? '+' : '' }}{{ $diffLic }}
                    </span>
                </td>
            </tr>
            <tr>
                <td>Total Días de Ausencia</td>
                <td class="text-right">{{ number_format($comparativa['dias_anterior'] ?? 0, 0, ',', '.') }}</td>
                <td class="text-right font-bold">{{ number_format($comparativa['dias_actual'] ?? 0, 0, ',', '.') }}</td>
                <td class="text-right">
                    @php $diffDias = ($comparativa['dias_actual'] ?? 0) - ($comparativa['dias_anterior'] ?? 0); @endphp
                    <span style="color: {{ $diffDias > 0 ? '#dc2626' : '#166534' }}; font-weight: bold;">
                        {{ $diffDias > 0 ? '+' : '' }}{{ $diffDias }}
                    </span>
                </td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">Ranking de Ausentismo (Top 5)</div>
    <table class="details-table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 35%;">Colaborador</th>
                <th style="width: 25%;">Tipo Contrato</th>
                <th class="text-center" style="width: 15%;">Cant. Licencias</th>
                <th class="text-center" style="width: 20%;">Total Días</th>
            </tr>
        </thead>
        <tbody>
            @forelse($topEmpleados as $emp)
                <tr>
                    <td>{{ $loop->iteration }}</td>
                    <td style="font-weight: bold;">{{ $emp['nombre_completo'] ?? 'N/A' }}</td>
                    <td>{{ ucfirst(str_replace('_', ' ', $emp['tipo_contrato'] ?? '-')) }}</td>
                    <td class="text-center">{{ $emp['total_licencias'] }}</td>
                    <td class="text-center">
                        <span style="font-weight: bold; color: #dc2626;">{{ $emp['total_dias_licencia'] }} días</span>
                    </td>
                </tr>
            @empty
                <tr><td colspan="5" class="text-center">No hay registros de ausentismo para este período.</td></tr>
            @endforelse
        </tbody>
    </table>

    @if($alertasCriticas->count())
        <div class="section-title" style="color: #dc2626; border-color: #fecaca;">Alertas de Riesgo Detectadas</div>
        @foreach($alertasCriticas as $alerta)
            <div class="alert-box">
                <strong>{{ $alerta['nombre_completo'] }}:</strong> {{ $alerta['motivo_alerta'][0] ?? 'Patrón de ausentismo inusual detectado.' }}
                (Acumulado: {{ $alerta['total_dias_licencia'] }} días)
            </div>
        @endforeach
    @endif

    <div class="section-title">Detalle Completo por Empleado</div>
    <table class="details-table">
        <thead>
            <tr>
                <th>Empleado</th>
                <th>Licencias</th>
                <th>Días</th>
                <th>Estado</th>
                <th>Acción Sugerida</th>
            </tr>
        </thead>
        <tbody>
            @foreach($ranking as $item)
                <tr>
                    <td>{{ $item['nombre_completo'] }}</td>
                    <td>{{ $item['total_licencias'] }}</td>
                    <td>{{ $item['total_dias_licencia'] }}</td>
                    <td>
                        @if($item['alerta_rendimiento'])
                            <span class="badge badge-danger">CRÍTICO</span>
                        @else
                            <span class="badge badge-success">NORMAL</span>
                        @endif
                    </td>
                    <td style="font-size: 9px; color: #64748b;">{{ $item['accion_sugerida'] ?? '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 9px; color: #94a3b8;">
        Documento confidencial de uso interno. Generado el {{ now()->format('d/m/Y H:i') }}
    </div>
</body>
</html>
