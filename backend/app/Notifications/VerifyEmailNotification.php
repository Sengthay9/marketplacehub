<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailNotification extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $verifyUrl = config('app.frontend_url', config('app.url'))
            . '/verify-email?id=' . $notifiable->id
            . '&hash=' . sha1($notifiable->email);

        return (new MailMessage)
            ->subject('Verify Your Email – MarketplaceHub')
            ->greeting("Hi {$notifiable->name},")
            ->line('Please click the button below to verify your email address.')
            ->action('Verify Email', $verifyUrl)
            ->line('If you did not create an account, no further action is required.');
    }
}
