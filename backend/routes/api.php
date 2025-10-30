<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RolController;
use App\Http\Controllers\BusController;
use App\Http\Controllers\ConductorController;
use App\Http\Controllers\EmpleadoController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RutaController;
use App\Http\Controllers\AsistenteController;
use App\Http\Controllers\ViajeController;
use App\Http\Controllers\MecanicoController;
use App\Http\Controllers\MantenimientoController;

// ROLES
Route::get('/roles', [RolController::class, 'index']);
Route::get('/roles/{id}', [RolController::class, 'show']);
Route::post('/roles', [RolController::class, 'store']);
Route::put('/roles/{id}', [RolController::class, 'update']);
Route::delete('/roles/{id}', [RolController::class, 'destroy']);

// USUARIOS
Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::post('/users', [UserController::class, 'store']);
Route::put('/users/{id}', [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);

// EMPLEADOS
Route::get('/empleados', [EmpleadoController::class, 'index']);
Route::get('/empleados/{id}', [EmpleadoController::class, 'show']);
Route::post('/empleados', [EmpleadoController::class, 'store']);
Route::put('/empleados/{id}', [EmpleadoController::class, 'update']);
Route::delete('/empleados/{id}', [EmpleadoController::class, 'destroy']);

// CONDUCTORES
Route::get('/conductores', [ConductorController::class, 'index']);
Route::get('/conductores/{id}', [ConductorController::class, 'show']);
Route::post('/conductores', [ConductorController::class, 'store']);
Route::put('/conductores/{id}', [ConductorController::class, 'update']);
Route::delete('/conductores/{id}', [ConductorController::class, 'destroy']);

// BUSES
Route::get('/buses', [BusController::class, 'index']);
Route::get('/buses/{id}', [BusController::class, 'show']);
Route::post('/buses', [BusController::class, 'store']);
Route::put('/buses/{id}', [BusController::class, 'update']);
Route::delete('/buses/{id}', [BusController::class, 'destroy']);

// RUTAS
Route::get('/rutas', [RutaController::class, 'index']);
Route::get('/rutas/{id}', [RutaController::class, 'show']);
Route::post('/rutas', [RutaController::class, 'store']);
Route::put('/rutas/{id}', [RutaController::class, 'update']);
Route::delete('/rutas/{id}', [RutaController::class, 'destroy']);

// ASISTENTES
Route::get('/asistentes', [AsistenteController::class, 'index']);
Route::get('/asistentes/{id}', [AsistenteController::class, 'show']);
Route::post('/asistentes', [AsistenteController::class, 'store']);
Route::put('/asistentes/{id}', [AsistenteController::class, 'update']);
Route::delete('/asistentes/{id}', [AsistenteController::class, 'destroy']);

// VIAJES
Route::get('/viajes', [ViajeController::class, 'index']);
Route::get('/viajes/{id}', [ViajeController::class, 'show']);
Route::post('/viajes', [ViajeController::class, 'store']);
Route::put('/viajes/{id}', [ViajeController::class, 'update']);
Route::delete('/viajes/{id}', [ViajeController::class, 'destroy']);


// MECANICOS
Route::get('/mecanicos', [MecanicoController::class, 'index']);
Route::get('/mecanicos/{id}', [MecanicoController::class, 'show']);
Route::post('/mecanicos', [MecanicoController::class, 'store']);
Route::put('/mecanicos/{id}', [MecanicoController::class, 'update']);
Route::delete('/mecanicos/{id}', [MecanicoController::class, 'destroy']);

//mantenimientos
Route::apiResource('mantenimientos', MantenimientoController::class);