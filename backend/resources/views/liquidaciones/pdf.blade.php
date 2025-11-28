<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Liquidación de Sueldo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 20px; color: #2563eb; }
        .info-box { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; }
        .info-box h3 { color: #1f2937; margin-bottom: 10px; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .field { margin-bottom: 8px; }
        .field strong { color: #374151; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        table th, table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
        table th { background-color: #2563eb; color: white; }
        .total-box { margin-top: 20px; padding: 15px; background-color: #dbeafe; border: 2px solid #2563eb; }
        .total-box h2 { color: #1e40af; text-align: right; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>LIQUIDACIÓN DE SUELDO</h1>
        <p>N° Comprobante: <strong>{{ $liquidacion->numero_comprobante ?? 'BORRADOR' }}</strong></p>
    </div>

    <div class="info-box">
        <h3>Datos del Empleado</h3>
        <div class="grid">
            <div class="field"><strong>Nombre:</strong> {{ $liquidacion->empleado->user->nombre }} {{ $liquidacion->empleado->user->apellido }}</div>
            <div class="field"><strong>RUT:</strong> {{ $liquidacion->empleado->user->rut }}</div>
            <div class="field"><strong>N° Empleado:</strong> {{ $liquidacion->empleado->numero_empleado }}</div>
            <div class="field"><strong>AFP:</strong> {{ $liquidacion->empleado->nombre_afp }}</div>
            <div class="field"><strong>Isapre/Fonasa:</strong> {{ $liquidacion->empleado->nombre_isapre }}</div>
        </div>
    </div>

    <div class="info-box">
        <h3>Período de Liquidación</h3>
        <div class="grid">
            <div class="field"><strong>Desde:</strong> {{ $liquidacion->periodo_desde->format('d/m/Y') }}</div>
            <div class="field"><strong>Hasta:</strong> {{ $liquidacion->periodo_hasta->format('d/m/Y') }}</div>
            <div class="field"><strong>Estado:</strong> {{ strtoupper($liquidacion->estado) }}</div>
            @if($liquidacion->fecha_pago)
            <div class="field"><strong>Fecha de Pago:</strong> {{ $liquidacion->fecha_pago->format('d/m/Y') }}</div>
            @endif
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>CONCEPTO</th>
                <th style="text-align: right;">MONTO</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td colspan="2" style="background-color: #d1fae5;"><strong>HABERES</strong></td>
            </tr>
            <tr>
                <td>Sueldo Base</td>
                <td style="text-align: right;">${{ number_format($liquidacion->sueldo_base, 0, ',', '.') }}</td>
            </tr>
            @if($liquidacion->bonificaciones > 0)
            <tr>
                <td>Bonificaciones</td>
                <td style="text-align: right;">${{ number_format($liquidacion->bonificaciones, 0, ',', '.') }}</td>
            </tr>
            @endif
            @if($liquidacion->horas_extras_valor > 0)
            <tr>
                <td>Horas Extras</td>
                <td style="text-align: right;">${{ number_format($liquidacion->horas_extras_valor, 0, ',', '.') }}</td>
            </tr>
            @endif
            <tr>
                <td colspan="2" style="background-color: #fecaca;"><strong>DESCUENTOS</strong></td>
            </tr>
            @if($liquidacion->descuento_afp > 0)
            <tr>
                <td>Descuento AFP</td>
                <td style="text-align: right;">-${{ number_format($liquidacion->descuento_afp, 0, ',', '.') }}</td>
            </tr>
            @endif
            @if($liquidacion->descuento_isapre > 0)
            <tr>
                <td>Descuento Isapre/Fonasa</td>
                <td style="text-align: right;">-${{ number_format($liquidacion->descuento_isapre, 0, ',', '.') }}</td>
            </tr>
            @endif
            @if($liquidacion->descuento_impuesto_renta > 0)
            <tr>
                <td>Impuesto a la Renta</td>
                <td style="text-align: right;">-${{ number_format($liquidacion->descuento_impuesto_renta, 0, ',', '.') }}</td>
            </tr>
            @endif
            @if($liquidacion->descuento_seguro_desempleo > 0)
            <tr>
                <td>Seguro de Cesantía</td>
                <td style="text-align: right;">-${{ number_format($liquidacion->descuento_seguro_desempleo, 0, ',', '.') }}</td>
            </tr>
            @endif
            @if($liquidacion->otros_descuentos > 0)
            <tr>
                <td>Otros Descuentos</td>
                <td style="text-align: right;">-${{ number_format($liquidacion->otros_descuentos, 0, ',', '.') }}</td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="total-box">
        <h2>LÍQUIDO A PAGAR: ${{ number_format($liquidacion->sueldo_liquido, 0, ',', '.') }}</h2>
    </div>

    @if($liquidacion->observaciones)
    <div class="info-box">
        <h3>Observaciones</h3>
        <p>{{ $liquidacion->observaciones }}</p>
    </div>
    @endif

    <div class="footer">
        <p>Documento generado el {{ now()->format('d/m/Y H:i') }}</p>
        <p>Este documento es una representación válida de la liquidación de sueldo</p>
    </div>
</body>
</html>