<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VendorApprovedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $username,
        private readonly string $plainPassword,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $loginUrl = config('app.frontend_url', config('app.url')) . '/login';

        return (new MailMessage)
            ->subject('Your CamCart Vendor Account Has Been Approved')
            ->greeting("Congratulations, {$notifiable->name}!")
            ->line('Your vendor application on CamCart has been reviewed and approved.')
            ->line('Here are your login credentials:')
            ->line("**Email:** {$notifiable->email}")
            ->line("**Username:** {$this->username}")
            ->line("**Password:** {$this->plainPassword}")
            ->action('Sign In to Your Vendor Account', $loginUrl)
            ->line('You can also sign in faster using the Google account you registered with.')
            ->line('Once signed in, set up your shop and start selling!');
    }
}
