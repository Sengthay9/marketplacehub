<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = ['site_name', 'logo_path'];

    public static function current(): self
    {
        return static::firstOrCreate([], ['site_name' => 'CamCart']);
    }
}
