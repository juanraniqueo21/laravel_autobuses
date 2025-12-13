<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Análisis de mantenimientos</title>
  <style>
    body { font-family: "Inter", "Helvetica Neue", Arial, sans-serif; font-size: 12px; color: #1f2937; margin: 16px; }
    h1 { font-size: 22px; margin: 0; }
    .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px; }
    .report-subtitle { color: #64748b; font-size: 13px; margin-top: 4px; }
    .report-meta { font-size: 11px; color: #475569; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #f8fafc; }
    .kpi-card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin-bottom: 4px; }
    .kpi-card .value { font-size: 18px; font-weight: 600; }
    .kpi-card .hint { font-size: 10px; color: #64748b; margin-top: 4px; }
    .comparativa { border: 1px dashed #cbd5f5; border-radius: 10px; padding: 10px 12px; margin-bottom: 14px; background: #f8fafc; }
    .comparativa p { margin: 0 0 4px; font-size: 12px; color: #334155; }
    .comparativa table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .comparativa th, .comparativa td { text-align: left; padding: 4px 6px; }
    .comparativa th { font-weight: 600; color: #1d4ed8; }
    .notas { margin-bottom: 16px; }
    .notas ul { padding-left: 16px; margin: 6px 0; color: #0f172a; font-size: 11.5px; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; }
    th { background: #f8fafc; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .badge { display: inline-block; padding: 2px 6px; font-size: 10px; border-radius: 999px; }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef9c3; color: #92400e; }
    .summary-highlight { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .top-costos, .service-summary { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #fff; }
    .summary-subtitle { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; margin-bottom: 8px; }
    .top-costos ul { list-style: none; margin: 0; padding: 0; }
    .top-costos li { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .top-costos li:last-child { border-bottom: none; }
    .top-costos .index { width: 28px; height: 28px; border-radius: 999px; background: #f8fafc; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; color: #374151; font-weight: 700; }
    .top-costos .top-info { flex: 1; }
    .top-costos .top-info .bus-name { margin: 0; font-size: 12px; font-weight: 600; }
    .top-costos .top-info .bus-detail { margin: 0; font-size: 10px; color: #6b7280; }
    .top-costos .value { font-size: 12px; font-weight: 600; color: #1d4ed8; }
    .service-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
    .service-item { border-radius: 8px; border: 1px dashed #e5e7eb; padding: 8px; background: #f8fafc; }
    .service-name { font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; }
    .service-value { margin: 4px 0; font-size: 14px; font-weight: 600; }
    .service-hint { font-size: 11px; color: #0f172a; }
    .empty-note { font-size: 11px; color: #6b7280; margin: 0; }
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
  <div class="report-header">
    <div>
      <h1>Análisis de mantenimientos</h1>
      <p class="report-subtitle">{{ $comparativa['periodo_actual'] ?? 'Mes actual' }}</p>
    </div>
    <div class="report-meta">
      Mes seleccionado: {{ $mesNombre }} {{ $filtros['anio'] ?? '' }}<br>
      Tipo: {{ ucfirst($filtros['tipo_mantenimiento'] ?? 'Todos') }}
    </div>
  </div>

  @php
    $totales = (array) ($resumenTotales ?? (object) [
      'total_mantenimientos' => 0,
      'total_costos' => 0,
      'preventivos' => 0,
      'correctivos' => 0,
      'en_proceso' => 0,
    ]);
  @endphp

  <section class="kpi-grid">
    <div class="kpi-card">
      <div class="label">Total mantenimientos</div>
      <div class="value">{{ number_format($totales['total_mantenimientos'] ?? 0, 0, ',', '.') }}</div>
      <div class="hint">{{ $comparativa['total_anterior'] ?? 0 }} en {{ $comparativa['periodo_anterior'] ?? 'mes anterior' }}</div>
    </div>
    <div class="kpi-card">
      <div class="label">Costo total</div>
      <div class="value">${{ number_format($totales['total_costos'] ?? 0, 0, ',', '.') }}</div>
      <div class="hint">Promedio ${{
        number_format($resumen['costo_promedio'] ?? 0, 0, ',', '.')
      }}</div>
    </div>
    <div class="kpi-card">
      <div class="label">Preventivos / Correctivos</div>
      <div class="value">{{ $totales['preventivos'] ?? 0 }} / {{ $totales['correctivos'] ?? 0 }}</div>
      <div class="hint">P: {{ $resumen['porcentaje_preventivos'] ?? 0 }}% · C: {{ $resumen['porcentaje_correctivos'] ?? 0 }}%</div>
    </div>
    <div class="kpi-card">
      <div class="label">En proceso</div>
      <div class="value">{{ $totales['en_proceso'] ?? 0 }}</div>
      <div class="hint">Revisar bloqueos</div>
    </div>
  </section>

  <section class="summary-highlight">
    <div class="top-costos">
      <p class="summary-subtitle">Top 3 buses por costo total</p>
      @if($topCostos->isEmpty())
        <p class="empty-note">No hay buses con datos suficientes.</p>
      @else
        <ul>
          @foreach($topCostos as $item)
            <li>
              <span class="index">{{ $loop->iteration }}</span>
              <div class="top-info">
                <p class="bus-name">{{ $item['patente'] ?? 'N/A' }}</p>
                <p class="bus-detail">{{ $item['tipo_servicio'] ?? 'N/A' }} · {{ $item['total_mantenimientos'] ?? 0 }} manten.</p>
              </div>
              <span class="value">${{ number_format($item['costo_total_mantenimientos'] ?? 0, 0, ',', '.') }}</span>
            </li>
          @endforeach
        </ul>
      @endif
    </div>
    <div class="service-summary">
      <p class="summary-subtitle">Distribución por tipo de servicio</p>
      @if($serviciosResumen->isEmpty())
        <p class="empty-note">Sin datos por tipo de servicio.</p>
      @else
        <div class="service-grid">
          @foreach($serviciosResumen as $servicio => $meta)
            <div class="service-item">
              <span class="service-name">{{ ucfirst($servicio) }}</span>
              <strong class="service-value">{{ $meta['cantidad'] }} mantenimientos</strong>
              <span class="service-hint">${{ number_format($meta['costo'], 0, ',', '.') }}</span>
            </div>
          @endforeach
        </div>
      @endif
    </div>
  </section>

  <section class="comparativa">
    <p><strong>Comparativa mensual</strong></p>
    <table>
      <thead>
        <tr>
          <th></th>
          <th>{{ $comparativa['periodo_anterior'] ?? 'Mes anterior' }}</th>
          <th>{{ $comparativa['periodo_actual'] ?? 'Mes actual' }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Total mantenimientos</td>
          <td>{{ number_format($comparativa['total_anterior'] ?? 0, 0, ',', '.') }}</td>
          <td>{{ number_format($comparativa['total_actual'] ?? 0, 0, ',', '.') }}</td>
        </tr>
        <tr>
          <td>Costo acumulado</td>
          <td>${{ number_format($comparativa['costo_anterior'] ?? 0, 0, ',', '.') }}</td>
          <td>${{ number_format($comparativa['costo_actual'] ?? 0, 0, ',', '.') }}</td>
        </tr>
      </tbody>
    </table>
  </section>

  @if(!empty($notas))
  <section class="notas">
    <p><strong>Notas destacadas</strong></p>
    <ul>
      @foreach($notas as $nota)
        <li>{{ $nota }}</li>
      @endforeach
    </ul>
  </section>
  @endif

  <section class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Patente</th>
          <th>Servicio</th>
          <th>Tipo</th>
          <th>Total</th>
          <th>Preventivos</th>
          <th>Correctivos</th>
          <th>En proceso</th>
          <th>Costo total</th>
        </tr>
      </thead>
      <tbody>
        @foreach($analisis as $item)
          <tr>
            <td>{{ $loop->iteration }}</td>
            <td>{{ $item['patente'] }}</td>
            <td>{{ $item['tipo_servicio'] }}</td>
            <td>{{ $item['estado_bus'] }}</td>
            <td>{{ $item['total_mantenimientos'] }}</td>
            <td>{{ $item['preventivos'] }}</td>
            <td>{{ $item['correctivos'] }}</td>
            <td>
              <span class="badge badge-warning">{{ $item['en_proceso'] }}</span>
            </td>
            <td>${{ number_format($item['costo_total_mantenimientos'] ?? 0, 0, ',', '.') }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>
  </section>
</body>
</html>
