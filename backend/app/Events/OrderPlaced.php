<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderPlaced implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Order $order) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("vendor.{$this->order->shop_id}"),
            new PrivateChannel("customer.{$this->order->user_id}"),
        ];
    }

    public function broadcastAs(): string { return 'order.placed'; }

    public function broadcastWith(): array
    {
        return [
            'order_number' => $this->order->order_number,
            'total'        => $this->order->total,
            'status'       => $this->order->status,
        ];
    }
}
