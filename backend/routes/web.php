<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TestController;

// CORS preflight
if (request()->getMethod() === "OPTIONS") {
    header('Access-Control-Allow-Origin: http://localhost:5173');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 3600');
    http_response_code(200);
    exit;
}

// CORS headers
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

Route::get('/', function () {
    return view('welcome');
});

Route::get('/test', [TestController::class, 'test']);