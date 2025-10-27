<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TestController extends Controller
{
    public function test()
    {
        return response()->json([
            'message' => '¡Backend conectado correctamente!',
            'status' => 'ok',
            'timestamp' => now()
        ]);
    }
}