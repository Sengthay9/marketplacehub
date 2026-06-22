<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VendorApprovedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $plainPassword
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $loginUrl = config('app.frontend_url', config('app.url')) . '/login';

        return (new MailMessage)
            ->subject('🎉 Your Vendor Account Has Been Approved!')
            ->greeting("Congratulations, {$notifiable->name}!")
            ->line('Your vendor account on MarketplaceHub has been approved by our team.')
            ->line('Here are your login credentials:')
            ->line("**Email:** {$notifiable->email}")
            ->line("**Password:** {$this->plainPassword}")
            ->action('Sign In to Your Account', $loginUrl)
            ->line('Please change your password after signing in for security.')
            ->line('You can now set up your shop and start selling!');
    }
}
