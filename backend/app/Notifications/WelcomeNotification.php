<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Welcome to CamCart!')
            ->greeting("Hi {$notifiable->name},")
            ->line('Welcome to CamCart — the multi-vendor marketplace for everyone.')
            ->line('Start browsing thousands of products from verified shops.')
            ->action('Start Shopping', config('app.url'))
            ->line('Thank you for joining us!');
    }
}
