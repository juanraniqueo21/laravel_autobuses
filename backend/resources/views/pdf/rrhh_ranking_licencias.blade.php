<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ranking de licencias</title>
  <style>
    body { font-family: "Inter", "Helvetica Neue", Arial, sans-serif; color: #111827; margin: 16px; }
    h1 { margin: 0; font-size: 22px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; }
    .header .meta { font-size: 12px; color: #475569; margin-top: 6px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 16px 0; }
    .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; background: #f9fafb; }
    .card .label { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; margin-bottom: 4px; }
    .card .value { font-size: 18px; font-weight: 600; }
    .comparativa { border: 1px dashed #cbd5f5; border-radius: 10px; padding: 10px; background: #f8fafc; margin-bottom: 16px; }
    .comparativa table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .comparativa th, .comparativa td { padding: 4px 6px; text-align: left; }
    .comparativa th { color: #1d4ed8; font-weight: 600; }
    .alertas { margin-bottom: 16px; }
    .alerta-item { background: #fff; border: 1px solid #fee2e2; border-left: 4px solid #f87171; padding: 6px 10px; margin-bottom: 6px; border-radius: 6px; font-size: 11px; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; }
    th { background: #f8fafc; text-transform: uppercase; font-size: 10px; letter-spacing: 0.03em; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 999px; font-size: 10px; }
    .badge-danger { background: #fee2e2; color: #b91c1c; }
    .badge-info { background: #e0f2fe; color: #0c4a6e; }
    .top-empleados { border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; padding: 12px; margin-bottom: 16px; }
    .top-empleados .empleado-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .top-empleados .empleado-item:last-child { border-bottom: none; }
    .empleado-info { font-size: 12px; }
    .empleado-info .nombre { font-weight: 600; margin: 0; }
    .empleado-info .meta { margin: 0; font-size: 10px; color: #6b7280; }
    .top-metric { text-align: right; }
    .top-metric span { display: block; font-size: 12px; font-weight: 600; }
    .notas { margin-bottom: 16px; border: 1px dashed #cbd5f5; border-radius: 10px; padding: 10px 12px; background: #f8fafc; }
    .notas ul { padding-left: 16px; margin: 6px 0 0; color: #0f172a; font-size: 11px; }
    .summary-subtitle { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; margin-bottom: 8px; }
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
    $topEmpleados = collect($ranking)->sortByDesc('total_dias_licencia')->take(3);
  @endphp
  <div class="header">
    <div>
      <h1>RRHH · Ranking de licencias</h1>
      <p class="meta">Periodo actual: {{ $comparativa['periodo_actual'] ?? '-' }} · Periodo anterior: {{ $comparativa['periodo_anterior'] ?? '-' }}</p>
    </div>
    <div class="meta">
      Mes: {{ $mesNombre }} · Año: {{ $filtros['anio'] ?? '-' }}
    </div>
  </div>

  <section class="grid">
    <div class="card">
      <div class="label">Licencias totales</div>
      <div class="value">{{ number_format($resumen['total_licencias'] ?? 0, 0, ',', '.') }}</div>
      <div class="label" style="font-size: 9px; margin-top: 4px;">+{{ $comparativa['licencias_actual'] ?? 0 }} actual / {{ $comparativa['licencias_anterior'] ?? 0 }} anterior</div>
    </div>
    <div class="card">
      <div class="label">Días totales</div>
      <div class="value">{{ number_format($resumen['total_dias'] ?? 0, 0, ',', '.') }}</div>
      <div class="label" style="font-size: 9px; margin-top: 4px;">{{ $comparativa['dias_actual'] ?? 0 }} vs {{ $comparativa['dias_anterior'] ?? 0 }}</div>
    </div>
    <div class="card">
      <div class="label">Licencias médicas</div>
      <div class="value">{{ number_format($resumen['medicas'] ?? 0, 0, ',', '.') }}</div>
    </div>
    <div class="card">
      <div class="label">Administrativas + permisos</div>
      <div class="value">{{ number_format(($resumen['administrativas'] ?? 0) + ($resumen['permisos'] ?? 0), 0, ',', '.') }}</div>
    </div>
  </section>

  <section class="comparativa">
    <p style="margin-bottom: 6px; font-weight: 600;">Comparativa mensual</p>
    <table>
      <thead>
        <tr>
          <th>Indicador</th>
          <th>{{ $comparativa['periodo_anterior'] ?? 'Mes anterior' }}</th>
          <th>{{ $comparativa['periodo_actual'] ?? 'Mes actual' }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Licencias</td>
          <td>{{ number_format($comparativa['licencias_anterior'] ?? 0, 0, ',', '.') }}</td>
          <td>{{ number_format($comparativa['licencias_actual'] ?? 0, 0, ',', '.') }}</td>
        </tr>
        <tr>
          <td>Días</td>
          <td>{{ number_format($comparativa['dias_anterior'] ?? 0, 0, ',', '.') }}</td>
          <td>{{ number_format($comparativa['dias_actual'] ?? 0, 0, ',', '.') }}</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="top-empleados">
    <p class="summary-subtitle">Top 3 ausentismos en días</p>
    @if($topEmpleados->isEmpty())
      <p class="empty-note">No hay licencias registradas para el período.</p>
    @else
      @foreach($topEmpleados as $emp)
        <div class="empleado-item">
          <div class="empleado-info">
            <p class="nombre">{{ $emp['nombre_completo'] ?? 'Empleado' }}</p>
            <p class="meta">{{ ucfirst($emp['tipo_contrato'] ?? 'Contrato') }} · {{ $emp['total_licencias'] ?? 0 }} licencias</p>
          </div>
          <div class="top-metric">
            <span>{{ $emp['total_dias_licencia'] ?? 0 }}d</span>
            <small>{{ $emp['alerta_rendimiento'] ? 'Alerta crítica' : 'Estable' }}</small>
          </div>
        </div>
      @endforeach
    @endif
  </section>

  @if(!empty($notas))
    <section class="notas">
      <p class="summary-subtitle">Notas clave</p>
      <ul>
        @foreach($notas as $nota)
          <li>{{ $nota }}</li>
        @endforeach
      </ul>
    </section>
  @endif

  @if($alertasCriticas->count())
    <section class="alertas">
      <p style="font-weight: 600; margin-bottom: 6px;">Alertas críticas</p>
      @foreach($alertasCriticas as $alerta)
        <div class="alerta-item">
          <strong>{{ $alerta['nombre_completo'] ?? 'Empleado' }}</strong> · {{ ucfirst($alerta['tipo_contrato'] ?? 'N/A') }} · {{ $alerta['total_dias_licencia'] ?? 0 }} días · {{ $alerta['motivo_alerta'][0] ?? 'Sin motivo' }}
        </div>
      @endforeach
    </section>
  @endif

  <section class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Empleado</th>
          <th>Contrato</th>
          <th>Total licencias</th>
          <th>Días sumados</th>
          <th>Alertas</th>
          <th>Sugerencia</th>
        </tr>
      </thead>
      <tbody>
        @foreach($ranking as $item)
          <tr>
            <td>{{ $loop->iteration }}</td>
            <td>{{ $item['nombre_completo'] ?? 'N/A' }}</td>
            <td>{{ $item['tipo_contrato'] ?? 'N/A' }}</td>
            <td>{{ $item['total_licencias'] }}</td>
            <td>{{ $item['total_dias_licencia'] }}</td>
            <td>
              @if($item['alerta_rendimiento'])
                <span class="badge badge-danger">Crítica</span>
              @else
                <span class="badge badge-info">Estable</span>
              @endif
            </td>
            <td>{{ $item['accion_sugerida'] ?? 'Sin sugerencia' }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>
  </section>
</body>
</html>
