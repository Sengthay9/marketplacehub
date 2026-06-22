<?php

namespace App\Services\Notification;

use App\Events\NotificationCreated;
use App\Models\AppNotification;
use App\Models\User;

class NotificationService
{
    public function send(User $user, string $type, array $payload): AppNotification
    {
        $notification = AppNotification::create([
            'user_id' => $user->id,
            'type'    => $type,
            'title'   => $payload['title'],
            'message' => $payload['message'],
            'data'    => $payload['data'] ?? null,
        ]);

        event(new NotificationCreated($notification));

        return $notification;
    }

    public function getUnread(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        return AppNotification::where('user_id', $userId)
            ->whereNull('read_at')
            ->latest()
            ->get();
    }

    public function markAllRead(int $userId): void
    {
        AppNotification::where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }
}
