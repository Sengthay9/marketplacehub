<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Order $order) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("customer.{$this->order->user_id}")];
    }

    public function broadcastAs(): string { return 'order.status_updated'; }

    public function broadcastWith(): array
    {
        return [
            'order_number' => $this->order->order_number,
            'status'       => $this->order->status,
        ];
    }
}
