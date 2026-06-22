<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class UserModerationNotification extends Notification
{
    public function __construct(
        private readonly string $type,    // warn | suspend | ban | unban
        private readonly string $reason,
        private readonly ?string $until = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'    => "moderation:{$this->type}",
            'title'   => $this->title(),
            'message' => $this->message(),
            'reason'  => $this->reason,
            'until'   => $this->until,
        ];
    }

    private function title(): string
    {
        return match ($this->type) {
            'warn'    => 'Warning from MarketplaceHub',
            'suspend' => 'Your account has been suspended',
            'ban'     => 'Your account has been permanently banned',
            'unban'   => 'Your account has been restored',
            default   => 'Account notice',
        };
    }

    private function message(): string
    {
        return match ($this->type) {
            'warn'    => "You have received a warning: {$this->reason}. Please follow our community guidelines.",
            'suspend' => $this->until
                ? "Your account has been suspended until {$this->until}. Reason: {$this->reason}"
                : "Your account has been suspended. Reason: {$this->reason}",
            'ban'     => "Your account has been permanently banned. Reason: {$this->reason}",
            'unban'   => 'Your account has been restored. You can log in again.',
            default   => $this->reason,
        };
    }
}
