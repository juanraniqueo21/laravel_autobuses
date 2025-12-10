#!/bin/bash

# Script de Diagnóstico - Análisis de Mantenimientos
# Verifica que todo esté correctamente conectado

echo "============================================"
echo "DIAGNÓSTICO: Módulo Análisis Mantenimientos"
echo "============================================"
echo ""

# 1. Verificar que existan mantenimientos en la BD
echo "1. Verificando mantenimientos en la base de datos..."
php artisan tinker --execute="
\$count = App\Models\Mantenimiento::count();
echo 'Total mantenimientos: ' . \$count . PHP_EOL;
if (\$count == 0) {
    echo '⚠️  NO HAY MANTENIMIENTOS EN LA BD' . PHP_EOL;
    echo '   Ejecuta: php artisan db:seed --class=DatosCompletosSeeder' . PHP_EOL;
}
"

echo ""

# 2. Verificar buses
echo "2. Verificando buses..."
php artisan tinker --execute="
\$count = App\Models\Bus::count();
echo 'Total buses: ' . \$count . PHP_EOL;
\$enMantenimiento = App\Models\Bus::where('estado', 'mantenimiento')->count();
echo 'Buses en mantenimiento: ' . \$enMantenimiento . PHP_EOL;
"

echo ""

# 3. Verificar rutas de API
echo "3. Verificando rutas de API..."
php artisan route:list --path=reportes/buses-con-mas-mantenimientos

echo ""

# 4. Test de endpoint
echo "4. Probando endpoint de buses con más mantenimientos..."
curl -s http://localhost:8000/api/reportes/buses-con-mas-mantenimientos \
  -H "Accept: application/json" | head -20

echo ""
echo ""
echo "============================================"
echo "FIN DEL DIAGNÓSTICO"
echo "============================================"
