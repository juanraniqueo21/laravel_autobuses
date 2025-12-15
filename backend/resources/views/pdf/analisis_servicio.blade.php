<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Análisis de servicio mensual</title>
  <style>
    body { font-family: "Inter", "Helvetica Neue", Arial, sans-serif; font-size: 12px; color: #1f2937; margin: 16px; }
    h1 { font-size: 22px; margin: 0; }
    .report-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
    .report-subtitle { color: #64748b; font-size: 13px; margin-top: 4px; }
    .report-meta { font-size: 11px; color: #475569; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 18px; }
    .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #f8fafc; }
    .kpi-card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin-bottom: 4px; }
    .kpi-card .value { font-size: 16px; font-weight: 600; }
    .kpi-card .hint { font-size: 10px; color: #64748b; margin-top: 4px; }
    .table-wrapper { margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #fff; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; }
    th { background: #f8fafc; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; text-align: left; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .badge { display: inline-flex; align-items: center; justify-content: center; padding: 2px 6px; border-radius: 999px; font-size: 10px; border: 1px solid transparent; }
    .badge-success { border-color: #27ae60; color: #14532d; background: #d1fae5; }
    .badge-warning { border-color: #facc15; color: #78350f; background: #fef3c7; }
    .subtitle { font-size: 11px; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.08em; }
    .footer-note { font-size: 10px; color: #6b7280; margin-top: 18px; }
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

  <div class="report-header">
    <div>
      <h1>Análisis de servicio</h1>
      <p class="report-subtitle">Reporte mensual</p>
    </div>
    <div class="report-meta">
      Mes seleccionado: <strong>{{ $mesNombre }}</strong><br>
      Generado: {{ Carbon::now()->locale('es')->isoFormat('LL') }}
    </div>
  </div>

  <section class="kpi-grid">
    <div class="kpi-card">
      <div class="label">Ingresos totales</div>
      <div class="value">${{ number_format($resumen['total_ingresos'] ?? 0, 0, ',', '.') }}</div>
      <div class="hint">Total de ventas en el periodo</div>
    </div>
    <div class="kpi-card">
      <div class="label">Gastos totales</div>
      <div class="value">${{ number_format($resumen['total_gastos'] ?? 0, 0, ',', '.') }}</div>
      <div class="hint">Combustible + peajes + gastos</div>
    </div>
    <div class="kpi-card">
      <div class="label">Ganancia neta</div>
      <div class="value">${{ number_format($resumen['ganancia_neta'] ?? 0, 0, ',', '.') }}</div>
      <div class="hint">{{ number_format($resumen['margen_porcentaje'] ?? 0, 2, ',', '.') }}% margen</div>
    </div>
    <div class="kpi-card">
      <div class="label">Viajes con alerta</div>
      <div class="value">{{ $resumen['viajes_con_alerta'] ?? 0 }}</div>
      <div class="hint">Diferencias > 10%</div>
    </div>
    <div class="kpi-card">
      <div class="label">Viajes deficitarios</div>
      <div class="value">{{ $resumen['viajes_deficitarios'] ?? 0 }}</div>
      <div class="hint">Costo > ingreso</div>
    </div>
    <div class="kpi-card">
      <div class="label">Pérdidas acumuladas</div>
      <div class="value">${{ number_format($resumen['perdida_total_deficitarios'] ?? 0, 0, ',', '.') }}</div>
      <div class="hint">Costo - Recaudación</div>
    </div>
  </section>

  <section class="table-wrapper">
    <p class="subtitle">Rentabilidad por tipo de servicio</p>
    @if($rentabilidadCollection->isEmpty())
      <p class="footer-note">No hay datos para mostrar.</p>
    @else
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Viajes</th>
            <th>Pasajeros</th>
            <th>Ingresos</th>
            <th>Gastos</th>
            <th>Ganancia</th>
            <th>Margen %</th>
            <th>Capacidad promedio</th>
          </tr>
        </thead>
        <tbody>
          @foreach($rentabilidadCollection as $item)
            <tr>
              <td>{{ $item['tipo_servicio'] }}</td>
              <td>{{ number_format($item['total_viajes'], 0, ',', '.') }}</td>
              <td>{{ number_format($item['total_pasajeros'], 0, ',', '.') }}</td>
              <td>${{ number_format($item['total_ingresos'], 0, ',', '.') }}</td>
              <td>${{ number_format($item['total_gastos'], 0, ',', '.') }}</td>
              <td>${{ number_format($item['ganancia_neta'], 0, ',', '.') }}</td>
              <td>{{ number_format($item['margen_porcentaje'], 2, ',', '.') }}%</td>
              <td>{{ number_format($item['capacidad_promedio'], 1, ',', '.') }}</td>
            </tr>
          @endforeach
        </tbody>
      </table>
    @endif
  </section>

  <section class="table-wrapper">
    <p class="subtitle">Ocupación por tipo de servicio</p>
    @if($ocupacionCollection->isEmpty())
      <p class="footer-note">No hay datos de ocupación.</p>
    @else
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Viajes</th>
            <th>Ocupación promedio</th>
            <th>Ocupación máxima</th>
            <th>Ocupación mínima</th>
            <th>Pasajeros promedio</th>
            <th>Capacidad promedio</th>
          </tr>
        </thead>
        <tbody>
          @foreach($ocupacionCollection as $item)
            <tr>
              <td>{{ $item['tipo_servicio'] }}</td>
              <td>{{ number_format($item['total_viajes'], 0, ',', '.') }}</td>
              <td>{{ number_format($item['tasa_ocupacion_promedio'], 1, ',', '.') }}%</td>
              <td>{{ number_format($item['tasa_ocupacion_maxima'], 1, ',', '.') }}%</td>
              <td>{{ number_format($item['tasa_ocupacion_minima'], 1, ',', '.') }}%</td>
              <td>{{ number_format($item['pasajeros_promedio'], 1, ',', '.') }}</td>
              <td>{{ number_format($item['capacidad_promedio'], 1, ',', '.') }}</td>
            </tr>
          @endforeach
        </tbody>
      </table>
    @endif
  </section>

  <p class="footer-note">Todos los montos están representados en pesos chilenos (CLP) y se calcula a partir de los viajes completados.</p>
</body>
</html>
