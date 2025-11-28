<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Logística</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #1f2937;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }

        .header h1 {
            font-size: 24px;
            color: #1e40af;
            margin-bottom: 5px;
        }

        .header p {
            font-size: 14px;
            color: #6b7280;
        }

        .info-periodo {
            background-color: #dbeafe;
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-weight: bold;
            color: #1e40af;
        }

        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #2563eb;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        table th {
            background-color: #2563eb;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #2563eb;
        }

        table td {
            padding: 10px;
            border: 1px solid #e5e7eb;
        }

        table tr:nth-child(even) {
            background-color: #f9fafb;
        }

        .metric-box {
            display: inline-block;
            width: 23%;
            margin: 1%;
            padding: 12px;
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            text-align: center;
        }

        .metric-value {
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
            margin: 5px 0;
        }

        .metric-label {
            font-size: 11px;
            color: #6b7280;
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }

        .efficiency-bar {
            width: 100%;
            height: 20px;
            background-color: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin: 8px 0;
        }

        .efficiency-fill {
            height: 100%;
            background-color: #10b981;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 12px;
        }

        .summary-item {
            background-color: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            border-left: 4px solid #2563eb;
        }

        .summary-item-label {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 4px;
        }

        .summary-item-value {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
        }
    </style>
</head>
<body>
    <!-- HEADER -->
    <div class="header">
        <h1>📊 REPORTE DE LOGÍSTICA</h1>
        <p>Sistema de Gestión de Buses</p>
    </div>

    <!-- PERÍODO -->
    <div class="info-periodo">
        {{ $stats['periodo']['nombre_mes'] }} / {{ $stats['periodo']['anio'] }}
    </div>

    <!-- SECCIÓN 1: RESUMEN GENERAL -->
    <div class="section">
        <div class="section-title">📈 Resumen General</div>
        
        <div class="metric-box">
            <div class="metric-label">Total de Buses</div>
            <div class="metric-value">{{ $stats['buses']['total'] }}</div>
        </div>
        <div class="metric-box">
            <div class="metric-label">Viajes Completados</div>
            <div class="metric-value" style="color: #10b981;">{{ $stats['viajes']['completados'] }}</div>
        </div>
        <div class="metric-box">
            <div class="metric-label">Turnos Ejecutados</div>
            <div class="metric-value">{{ $stats['turnos']['completados'] }}</div>
        </div>
        <div class="metric-box">
            <div class="metric-label">Mantenimientos</div>
            <div class="metric-value" style="color: #f59e0b;">{{ $stats['mantenimientos']['completados'] }}</div>
        </div>
    </div>

    <!-- SECCIÓN 2: ESTADO DE BUSES -->
    <div class="section">
        <div class="section-title">🚌 Estado de Buses</div>
        
        <div class="summary-grid">
            <div class="summary-item" style="border-left-color: #10b981;">
                <div class="summary-item-label">Operativos</div>
                <div class="summary-item-value" style="color: #10b981;">{{ $stats['buses']['operativos'] }}</div>
            </div>
            <div class="summary-item" style="border-left-color: #f59e0b;">
                <div class="summary-item-label">En Mantenimiento</div>
                <div class="summary-item-value" style="color: #f59e0b;">{{ $stats['buses']['en_mantenimiento'] }}</div>
            </div>
        </div>

        <table style="margin-top: 15px;">
            <tr>
                <th>Estado</th>
                <th>Cantidad</th>
                <th>Porcentaje</th>
            </tr>
            <tr>
                <td>Operativos</td>
                <td>{{ $stats['buses']['operativos'] }}</td>
                <td>{{ $stats['buses']['total'] > 0 ? round(($stats['buses']['operativos'] / $stats['buses']['total']) * 100) : 0 }}%</td>
            </tr>
            <tr>
                <td>En Mantenimiento</td>
                <td>{{ $stats['buses']['en_mantenimiento'] }}</td>
                <td>{{ $stats['buses']['total'] > 0 ? round(($stats['buses']['en_mantenimiento'] / $stats['buses']['total']) * 100) : 0 }}%</td>
            </tr>
        </table>
    </div>

    <!-- SECCIÓN 3: OPERACIONES MENSUALES -->
    <div class="section">
        <div class="section-title">📋 Operaciones Mensuales</div>

        <table>
            <tr>
                <th>Concepto</th>
                <th style="text-align: right;">Total</th>
                <th style="text-align: right;">Completados</th>
                <th style="text-align: right;">Cancelados</th>
            </tr>
            <tr>
                <td><strong>Viajes</strong></td>
                <td style="text-align: right;">{{ $stats['viajes']['total'] }}</td>
                <td style="text-align: right;">{{ $stats['viajes']['completados'] }}</td>
                <td style="text-align: right;">{{ $stats['viajes']['cancelados'] }}</td>
            </tr>
            <tr>
                <td><strong>Turnos</strong></td>
                <td style="text-align: right;">{{ $stats['turnos']['total'] }}</td>
                <td style="text-align: right;">{{ $stats['turnos']['completados'] }}</td>
                <td style="text-align: right;">-</td>
            </tr>
            <tr>
                <td><strong>Mantenimientos</strong></td>
                <td style="text-align: right;">{{ $stats['mantenimientos']['total'] }}</td>
                <td style="text-align: right;">{{ $stats['mantenimientos']['completados'] }}</td>
                <td style="text-align: right;">-</td>
            </tr>
        </table>
    </div>

    <!-- SECCIÓN 4: EFICIENCIA -->
    <div class="section">
        <div class="section-title">⚡ Indicadores de Eficiencia</div>

        <div style="margin-top: 15px;">
            <div style="margin-bottom: 15px;">
                <strong style="font-size: 13px;">Tasa de Viajes Completados</strong>
                @php
                    $tasa = $stats['viajes']['total'] > 0 ? round(($stats['viajes']['completados'] / $stats['viajes']['total']) * 100) : 0;
                @endphp
                <div class="efficiency-bar">
                    <div class="efficiency-fill" style="width: {{ $tasa }}%;">{{ $tasa }}%</div>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <strong style="font-size: 13px;">Disponibilidad de Buses</strong>
                @php
                    $disponibilidad = $stats['buses']['total'] > 0 ? round(($stats['buses']['operativos'] / $stats['buses']['total']) * 100) : 0;
                @endphp
                <div class="efficiency-bar">
                    <div class="efficiency-fill" style="width: {{ $disponibilidad }}%;">{{ $disponibilidad }}%</div>
                </div>
            </div>
        </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
        <p>Este reporte fue generado automáticamente el {{ now()->format('d/m/Y H:i') }} horas.</p>
        <p>Sistema de Gestión de Buses - Confidencial</p>
    </div>
</body>
</html>