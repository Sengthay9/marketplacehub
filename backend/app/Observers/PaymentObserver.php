<?php

namespace App\Observers;

use App\Models\AdminBankAccount;
use App\Models\Payment;
use App\Models\Payout;
use App\Models\ShopCommission;
use App\Services\KhqrService;
use Illuminate\Support\Facades\Log;

class PaymentObserver
{
    public function __construct(private KhqrService $khqr) {}

    public function updated(Payment $payment): void
    {
        if ($payment->wasChanged('status') && $payment->status === 'completed') {
            $this->recordCommission($payment);
        }
    }

    public function created(Payment $payment): void
    {
        if ($payment->status === 'completed') {
            $this->recordCommission($payment);
        }
    }

    private function recordCommission(Payment $payment): void
    {
        $order = $payment->order()->with('shop.bankAccounts')->first();

        if (!$order || !$order->shop_id) {
            return;
        }

        $fee          = (float) ($order->platform_fee ?? 0);
        $gross        = (float) $order->total;
        $vendorAmount = round($gross - $fee, 2);

        // ── Commission record (admin earnings tracker) ──
        if ($fee > 0 && !ShopCommission::where('order_id', $order->id)->exists()) {
            $rate = $gross > 0 ? round($fee / $gross, 4) : 0;

            ShopCommission::create([
                'shop_id'           => $order->shop_id,
                'order_id'          => $order->id,
                'year'              => now()->year,
                'month'             => now()->month,
                'cycle'             => 0,
                'period_start'      => now(),
                'period_end'        => now(),
                'gross_revenue'     => $gross,
                'commission_rate'   => $rate,
                'commission_amount' => $fee,
                'status'            => 'pending',
            ]);
        }

        // ── Payout record ──
        if (Payout::where('order_id', $order->id)->exists()) {
            return;
        }

        $payout = Payout::create([
            'order_id'      => $order->id,
            'shop_id'       => $order->shop_id,
            'gross_amount'  => $gross,
            'platform_fee'  => $fee,
            'vendor_amount' => $vendorAmount,
            'status'        => 'pending',
        ]);

        // ── Auto-transfer vendor share via Bakong ──
        $this->autoTransfer($payout, $order->shop);
    }

    private function autoTransfer(Payout $payout, $shop): void
    {
        // Need admin Bakong account with transfer token
        $adminAccount = AdminBankAccount::where('is_active', true)->first();
        if (!$adminAccount || !$adminAccount->hasTransferToken()) {
            Log::info('Bakong auto-transfer skipped: no transfer token configured.', ['payout_id' => $payout->id]);
            return;
        }

        // Need vendor's Bakong phone
        $vendorAccount = $shop->bankAccounts()
            ->where('bank_name', 'Bakong')
            ->where('is_primary', true)
            ->whereNotNull('phone_number')
            ->first();

        if (!$vendorAccount) {
            Log::info('Bakong auto-transfer skipped: vendor has no Bakong account.', [
                'payout_id' => $payout->id,
                'shop_id'   => $shop->id,
            ]);
            return;
        }

        $reference = 'PAYOUT-' . $payout->id . '-ORDER-' . $payout->order_id;

        $txRef = $this->khqr->transferToVendor(
            fromPhone:     $adminAccount->phone_number,
            toPhone:       $vendorAccount->phone_number,
            amount:        $payout->vendor_amount,
            currency:      'USD',
            reference:     $reference,
            transferToken: $adminAccount->bakong_transfer_token,
        );

        if ($txRef) {
            $payout->update([
                'status'       => 'completed',
                'reference'    => $txRef,
                'processed_at' => now(),
                'notes'        => 'Auto-transferred via Bakong API.',
            ]);

            Log::info('Bakong auto-transfer succeeded.', [
                'payout_id' => $payout->id,
                'to'        => $vendorAccount->phone_number,
                'amount'    => $payout->vendor_amount,
                'ref'       => $txRef,
            ]);
        } else {
            Log::warning('Bakong auto-transfer failed — payout stays pending for manual review.', [
                'payout_id' => $payout->id,
            ]);
        }
    }
}
