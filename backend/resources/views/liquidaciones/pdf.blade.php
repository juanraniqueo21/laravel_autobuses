<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Liquidación de Sueldo</title>
    <style>
        @page { margin: 0px; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px; /* Ajustado para mejor ajuste en carta */
            color: #334155; /* Slate 700 */
            line-height: 1.4;
            margin: 40px;
        }
        
        /* Utilidades */
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-blue { color: #2563eb; }
        .uppercase { text-transform: uppercase; }
        
        /* Encabezado */
        .header-table { width: 100%; margin-bottom: 25px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        .company-name { font-size: 22px; font-weight: bold; color: #0f172a; }
        .doc-title { font-size: 18px; color: #2563eb; font-weight: bold; text-align: right; }
        .doc-meta { font-size: 10px; color: #64748b; text-align: right; }

        /* Secciones de Datos */
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
            border-bottom: 1px solid #94a3b8;
            margin-bottom: 8px;
            padding-bottom: 2px;
            text-transform: uppercase;
            margin-top: 15px;
        }

        .info-table { width: 100%; margin-bottom: 10px; border-collapse: collapse; }
        .info-label { font-weight: bold; color: #475569; width: 120px; padding: 2px 0; }
        .info-value { color: #0f172a; padding: 2px 0; }
        
        /* Estado del documento */
        .status-badge {
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
        }
        .status-pagada { color: #166534; background-color: #dcfce7; border: 1px solid #166534; }
        .status-pendiente { color: #9a3412; background-color: #ffedd5; border: 1px solid #9a3412; }

        /* Tabla de Detalles Financieros */
        .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
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
        }
        .row-total { background-color: #f8fafc; font-weight: bold; }
        
        /* Caja del Total Líquido */
        .total-box-container { margin-top: 20px; text-align: right; }
        .total-box { 
            display: inline-block;
            background-color: #0f172a; 
            color: white; 
            padding: 10px 20px; 
            border-radius: 4px;
        }
        
        /* Observaciones y Firmas */
        .obs-section { 
            margin-top: 20px; 
            border: 1px dashed #cbd5e1; 
            padding: 8px; 
            font-size: 10px; 
            color: #64748b; 
        }

        .signatures { width: 100%; margin-top: 50px; }
        .sig-line { border-top: 1px solid #0f172a; width: 80%; margin: 0 auto; }
        .sig-text { text-align: center; margin-top: 5px; font-size: 9px; font-weight: bold; color: #334155; }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="vertical-align: bottom;">
                <div class="company-name">ConectaFlota</div>
                <div style="font-size: 10px; color: #64748b;">Gestión de Transporte</div>
            </td>
            <td style="vertical-align: bottom;">
                <div class="doc-title">LIQUIDACIÓN DE SUELDO</div>
                <div class="doc-meta">COMPROBANTE N°: {{ $liquidacion->numero_comprobante ?? 'BORRADOR' }}</div>
                <div class="doc-meta">FECHA EMISIÓN: {{ now()->format('d/m/Y') }}</div>
            </td>
        </tr>
    </table>

    <table style="width: 100%; margin-bottom: 10px;" cellspacing="0">
        <tr>
            <td style="width: 48%; vertical-align: top;">
                <div class="section-title">Datos del Colaborador</div>
                <table class="info-table">
                    <tr>
                        <td class="info-label">Nombre:</td>
                        <td class="info-value">{{ $liquidacion->empleado->user->nombre }} {{ $liquidacion->empleado->user->apellido }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">RUT:</td>
                        <td class="info-value">{{ $liquidacion->empleado->user->rut }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">N° Ficha:</td>
                        <td class="info-value">{{ $liquidacion->empleado->numero_empleado }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Tipo Contrato:</td>
                        <td class="info-value uppercase">{{ str_replace('_', ' ', $liquidacion->empleado->tipo_contrato) }}</td>
                    </tr>
                </table>
            </td>
            
            <td style="width: 4%;"></td> <td style="width: 48%; vertical-align: top;">
                <div class="section-title">Detalles del Período</div>
                <table class="info-table">
                    <tr>
                        <td class="info-label">Período:</td>
                        <td class="info-value">
                            {{ $liquidacion->periodo_desde->format('d/m/Y') }} al {{ $liquidacion->periodo_hasta->format('d/m/Y') }}
                        </td>
                    </tr>
                    <tr>
                        <td class="info-label">AFP:</td>
                        <td class="info-value">{{ $liquidacion->empleado->afp->nombre ?? 'Sin AFP' }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Salud:</td>
                        <td class="info-value">
                            {{ $liquidacion->empleado->isapre->nombre ?? ($liquidacion->empleado->fonasa ? 'FONASA' : 'N/A') }}
                        </td>
                    </tr>
                    <tr>
                        <td class="info-label">Estado:</td>
                        <td class="info-value">
                            <span class="status-badge {{ $liquidacion->estado == 'pagada' ? 'status-pagada' : 'status-pendiente' }}">
                                {{ strtoupper($liquidacion->estado) }}
                            </span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="details-table">
        <thead>
            <tr>
                <th>Concepto</th>
                <th class="text-right">Haberes (Imponibles)</th>
                <th class="text-right">Descuentos</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Sueldo Base</td>
                <td class="text-right">${{ number_format($liquidacion->sueldo_base, 0, ',', '.') }}</td>
                <td></td>
            </tr>
            
            @if($liquidacion->bonificaciones > 0)
            <tr>
                <td>Bonificaciones</td>
                <td class="text-right">${{ number_format($liquidacion->bonificaciones, 0, ',', '.') }}</td>
                <td></td>
            </tr>
            @endif
            
            @if($liquidacion->horas_extras_valor > 0)
            <tr>
                <td>Horas Extras</td>
                <td class="text-right">${{ number_format($liquidacion->horas_extras_valor, 0, ',', '.') }}</td>
                <td></td>
            </tr>
            @endif

            @if($liquidacion->descuento_afp > 0)
            <tr>
                <td>Cotización AFP ({{ $liquidacion->empleado->afp->nombre ?? '' }})</td>
                <td></td>
                <td class="text-right">${{ number_format($liquidacion->descuento_afp, 0, ',', '.') }}</td>
            </tr>
            @endif

            @if($liquidacion->descuento_isapre > 0)
            <tr>
                <td>Cotización Salud</td>
                <td></td>
                <td class="text-right">${{ number_format($liquidacion->descuento_isapre, 0, ',', '.') }}</td>
            </tr>
            @endif

            @if($liquidacion->descuento_impuesto_renta > 0)
            <tr>
                <td>Impuesto a la Renta</td>
                <td></td>
                <td class="text-right">${{ number_format($liquidacion->descuento_impuesto_renta, 0, ',', '.') }}</td>
            </tr>
            @endif

            @if($liquidacion->descuento_seguro_desempleo > 0)
            <tr>
                <td>Seguro de Cesantía (0.6%)</td>
                <td></td>
                <td class="text-right">${{ number_format($liquidacion->descuento_seguro_desempleo, 0, ',', '.') }}</td>
            </tr>
            @endif

            @if($liquidacion->otros_descuentos > 0)
            <tr>
                <td>Otros Descuentos</td>
                <td></td>
                <td class="text-right">${{ number_format($liquidacion->otros_descuentos, 0, ',', '.') }}</td>
            </tr>
            @endif

            <tr class="row-total">
                <td style="border-top: 2px solid #cbd5e1;">TOTALES</td>
                <td class="text-right" style="border-top: 2px solid #cbd5e1;">
                    ${{ number_format($liquidacion->sueldo_base + $liquidacion->bonificaciones + $liquidacion->horas_extras_valor, 0, ',', '.') }}
                </td>
                <td class="text-right text-blue" style="border-top: 2px solid #cbd5e1;">
                    ${{ number_format($liquidacion->descuento_afp + $liquidacion->descuento_isapre + $liquidacion->descuento_impuesto_renta + $liquidacion->descuento_seguro_desempleo + $liquidacion->otros_descuentos, 0, ',', '.') }}
                </td>
            </tr>
        </tbody>
    </table>

    <div class="total-box-container">
        <div class="total-box">
            <span style="font-size: 11px; margin-right: 15px; text-transform: uppercase;">Líquido a Pagar</span>
            <span style="font-size: 18px; font-weight: bold;">
                ${{ number_format($liquidacion->sueldo_liquido, 0, ',', '.') }}
            </span>
        </div>
        @if($liquidacion->fecha_pago)
        <div style="margin-top: 5px; font-size: 10px; color: #166534;">
            Pagado el {{ $liquidacion->fecha_pago->format('d/m/Y') }}
        </div>
        @endif
    </div>

    @if($liquidacion->observaciones)
    <div class="obs-section">
        <strong>Observaciones:</strong> {{ $liquidacion->observaciones }}
    </div>
    @endif

    <table class="signatures">
        <tr>
            <td style="width: 40%; text-align: center;">
                <div class="sig-line"></div>
                <div class="sig-text">FIRMA EMPLEADOR<br>ConectaFlota</div>
            </td>
            <td style="width: 20%;"></td>
            <td style="width: 40%; text-align: center;">
                <div class="sig-line"></div>
                <div class="sig-text">
                    FIRMA TRABAJADOR<br>
                    {{ $liquidacion->empleado->user->nombre }} {{ $liquidacion->empleado->user->apellido }}<br>
                    <span style="font-weight: normal;">RUT: {{ $liquidacion->empleado->user->rut }}</span>
                </div>
            </td>
        </tr>
    </table>

    <div style="text-align: center; font-size: 9px; color: #94a3b8; margin-top: 40px;">
        Certifico que he recibido de mi empleador, a mi entera satisfacción, el saldo líquido indicado en la presente liquidación,
        no teniendo cargo ni cobro alguno posterior que hacer.
    </div>

</body>
</html>