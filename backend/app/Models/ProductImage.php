<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    protected $fillable = ['product_id', 'path', 'is_primary', 'sort_order'];

    protected $appends = ['url'];

    protected function casts(): array
    {
        return ['is_primary' => 'boolean'];
    }

    public function getUrlAttribute(): string
    {
        // Strip any host prefix so the URL is always root-relative (/storage/...)
        $path = preg_replace('#^https?://[^/]+#', '', $this->path);
        if (!str_starts_with($path, '/')) {
            $path = '/storage/' . $path;
        }
        return $path;
    }

    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
}
