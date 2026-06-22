<?php

namespace App\Mail;

use App\Models\ShopCommission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CommissionInvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly ShopCommission $commission) {}

    public function envelope(): Envelope
    {
        $month  = $this->commission->month;
        $year   = $this->commission->year;
        $months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        return new Envelope(
            subject: "Commission Invoice — {$months[$month - 1]} {$year} — MarketplaceHub",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.commission-invoice',
        );
    }
}
