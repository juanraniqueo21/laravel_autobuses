<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RolController;
use App\Http\Controllers\BusController;
use App\Http\Controllers\ConductorController;

Route::get('/roles', [RolController::class, 'index']);
Route::get('/roles/{id}', [RolController::class, 'show']);
Route::post('/roles', [RolController::class, 'store']);
Route::put('/roles/{id}', [RolController::class, 'update']);
Route::delete('/roles/{id}', [RolController::class, 'destroy']);

Route::get('/buses', [BusController::class, 'index']);
Route::get('/buses/{id}', [BusController::class, 'show']);
Route::post('/buses', [BusController::class, 'store']);
Route::put('/buses/{id}', [BusController::class, 'update']);
Route::delete('/buses/{id}', [BusController::class, 'destroy']);


Route::get('/conductores', [ConductorController::class, 'index']);
Route::get('/conductores/{id}', [ConductorController::class, 'show']);
Route::post('/conductores', [ConductorController::class, 'store']);
Route::put('/conductores/{id}', [ConductorController::class, 'update']);
Route::delete('/conductores/{id}', [ConductorController::class, 'destroy']);