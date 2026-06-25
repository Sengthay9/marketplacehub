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
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appName = config('app.name', 'CamCart');
        $mail    = (new MailMessage)->from(config('mail.from.address'), $appName);

        return match ($this->type) {
            'suspend' => $mail
                ->subject("Your {$appName} Account Has Been Suspended")
                ->greeting("Hello, {$notifiable->name}")
                ->line('Your account has been temporarily suspended.')
                ->line("**Reason:** {$this->reason}")
                ->line($this->until
                    ? "**Suspension ends:** {$this->until}"
                    : "Your account will remain suspended until further notice.")
                ->line('You will not be able to sign in until the suspension is lifted.')
                ->line('If you believe this is a mistake, please contact our support team.')
                ->salutation("— The {$appName} Team"),

            'ban' => $mail
                ->subject("Your {$appName} Account Has Been Permanently Banned")
                ->greeting("Hello, {$notifiable->name}")
                ->line('Your account has been permanently banned from CamCart.')
                ->line("**Reason:** {$this->reason}")
                ->line('You will no longer be able to sign in to this account.')
                ->line('If you believe this is a mistake, please contact our support team.')
                ->salutation("— The {$appName} Team"),

            'unban' => $mail
                ->subject("Your {$appName} Account Has Been Restored")
                ->greeting("Hello, {$notifiable->name}")
                ->line('Great news — your account has been restored.')
                ->line('You can now sign in again.')
                ->action('Sign In', config('app.frontend_url', config('app.url')) . '/login')
                ->salutation("— The {$appName} Team"),

            default => $mail
                ->subject("Account Notice from {$appName}")
                ->greeting("Hello, {$notifiable->name}")
                ->line($this->reason),
        };
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
            'warn'    => 'Warning from CamCart',
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
