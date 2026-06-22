<?php

namespace App\Policies;

use App\Models\Shop;
use App\Models\User;

class ShopPolicy
{
    public function viewAny(User $user): bool { return true; }
    public function view(User $user, Shop $shop): bool { return true; }

    public function create(User $user): bool { return $user->isVendor(); }

    public function update(User $user, Shop $shop): bool
    {
        return $user->isAdmin() || $shop->user_id === $user->id;
    }

    public function delete(User $user, Shop $shop): bool
    {
        return $user->isAdmin();
    }

    public function approve(User $user): bool { return $user->isAdmin(); }
    public function reject(User $user): bool  { return $user->isAdmin(); }
    public function suspend(User $user): bool { return $user->isAdmin(); }
}
