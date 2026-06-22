<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        return $user->isAdmin()
            || $order->user_id === $user->id
            || $order->shop->user_id === $user->id;
    }

    public function cancel(User $user, Order $order): bool
    {
        return $order->user_id === $user->id && $order->isCancellable();
    }

    public function updateStatus(User $user, Order $order): bool
    {
        return $user->isAdmin() || $order->shop->user_id === $user->id;
    }
}
