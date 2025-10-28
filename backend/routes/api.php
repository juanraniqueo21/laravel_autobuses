<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RolController;
use App\Http\Controllers\BusController;

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