<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VendorRejectedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $reason) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $supportUrl = config('app.frontend_url', config('app.url')) . '/contact';

        return (new MailMessage)
            ->subject('CamCart Vendor Application Update')
            ->greeting("Hello, {$notifiable->name}!")
            ->line('Thank you for applying to become a vendor on CamCart.')
            ->line('After reviewing your application, we were unable to approve it at this time.')
            ->line('**Reason:** ' . $this->reason)
            ->action('Contact Support', $supportUrl)
            ->line('You are welcome to reapply after addressing the issue above.');
    }
}
