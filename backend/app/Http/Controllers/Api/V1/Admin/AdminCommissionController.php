<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Mail\CommissionInvoiceMail;
use App\Models\Order;
use App\Models\Shop;
use App\Models\ShopCommission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class AdminCommissionController extends Controller
{
    private const RATE = 0.15;

    public function index(Request $request): JsonResponse
    {
        $query = ShopCommission::with('shop:id,name,slug,logo')
            ->when($request->year,   fn ($q) => $q->where('year',   $request->year))
            ->when($request->month,  fn ($q) => $q->where('month',  $request->month))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->shop_id,fn ($q) => $q->where('shop_id',$request->shop_id))
            ->orderByDesc('year')->orderByDesc('month')
            ->orderByDesc('commission_amount');

        return response()->json($query->paginate(20));
    }

    public function summary(): JsonResponse
    {
        $now = now();

        return response()->json([
            'total_commission'         => ShopCommission::sum('commission_amount'),
            'paid_commission'          => ShopCommission::where('status', 'paid')->sum('commission_amount'),
            'pending_commission'       => ShopCommission::where('status', 'pending')->sum('commission_amount'),
            'this_month_commission'    => ShopCommission::where('year', $now->year)->where('month', $now->month)->sum('commission_amount'),
            'commission_rate'          => self::RATE,
            'shops_with_pending'       => ShopCommission::where('status', 'pending')->distinct('shop_id')->count(),
        ]);
    }

    public function calculate(Request $request): JsonResponse
    {
        $year  = (int) ($request->input('year',  now()->year));
        $month = (int) ($request->input('month', now()->month));

        $start = \Carbon\Carbon::create($year, $month, 1)->startOfMonth();
        $end   = $start->copy()->endOfMonth();

        $rows = Order::select('shop_id', DB::raw('SUM(total) as gross'))
            ->where('status', 'delivered')
            ->whereBetween('delivered_at', [$start, $end])
            ->groupBy('shop_id')
            ->get();

        $created = 0;
        $updated = 0;

        foreach ($rows as $row) {
            $commission = round($row->gross * self::RATE, 2);

            $record = ShopCommission::updateOrCreate(
                ['shop_id' => $row->shop_id, 'year' => $year, 'month' => $month],
                [
                    'gross_revenue'     => $row->gross,
                    'commission_rate'   => self::RATE,
                    'commission_amount' => $commission,
                ]
            );

            $record->wasRecentlyCreated ? $created++ : $updated++;
        }

        return response()->json([
            'message' => "Commission calculated for {$year}-{$month}. Created: {$created}, updated: {$updated}.",
            'year'  => $year,
            'month' => $month,
        ]);
    }

    public function markPaid(int $id): JsonResponse
    {
        $commission = ShopCommission::findOrFail($id);

        if ($commission->isPaid()) {
            return response()->json(['message' => 'Already marked as paid.'], 400);
        }

        $commission->update(['status' => 'paid', 'paid_at' => now()]);

        return response()->json(['message' => 'Commission marked as paid.', 'commission' => $commission]);
    }

    public function sendInvoice(int $id): JsonResponse
    {
        $commission = ShopCommission::with('shop.owner')->findOrFail($id);

        $invoiceNumber = $commission->invoice_number
            ?? 'INV-' . $commission->year . '-' . str_pad($commission->month, 2, '0', STR_PAD_LEFT) . '-' . str_pad($commission->id, 5, '0', STR_PAD_LEFT);

        $commission->update([
            'invoice_sent_at' => now(),
            'invoice_number'  => $invoiceNumber,
        ]);

        $emailSent = false;
        $owner = $commission->shop?->owner;

        if ($owner?->email) {
            try {
                Mail::to($owner->email)->send(new CommissionInvoiceMail($commission));
                $emailSent = true;
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Commission invoice email failed', [
                    'commission_id' => $commission->id,
                    'error'         => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message'        => $emailSent
                ? "Invoice {$invoiceNumber} sent to {$owner->email}."
                : "Invoice recorded. Email delivery failed — check SMTP settings.",
            'email_sent'     => $emailSent,
            'invoice_number' => $invoiceNumber,
            'invoice_sent_at'=> $commission->invoice_sent_at,
        ]);
    }

    public function sendAllInvoices(Request $request): JsonResponse
    {
        $request->validate([
            'year'  => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $commissions = ShopCommission::with('shop.owner')
            ->where('year',  $request->year)
            ->where('month', $request->month)
            ->whereNull('invoice_sent_at')
            ->get();

        $sent   = 0;
        $failed = 0;

        foreach ($commissions as $commission) {
            $invoiceNumber = 'INV-' . $commission->year . '-' . str_pad($commission->month, 2, '0', STR_PAD_LEFT) . '-' . str_pad($commission->id, 5, '0', STR_PAD_LEFT);
            $commission->update(['invoice_sent_at' => now(), 'invoice_number' => $invoiceNumber]);

            $owner = $commission->shop?->owner;
            if ($owner?->email) {
                try {
                    Mail::to($owner->email)->send(new CommissionInvoiceMail($commission));
                    $sent++;
                } catch (\Throwable) {
                    $failed++;
                }
            }
        }

        return response()->json([
            'message' => "Invoices sent: {$sent}. Failed: {$failed}.",
            'sent'    => $sent,
            'failed'  => $failed,
            'total'   => $commissions->count(),
        ]);
    }

    public function previewInvoice(int $id): Response
    {
        $commission = ShopCommission::with('shop.owner')->findOrFail($id);

        if (!$commission->invoice_number) {
            $commission->invoice_number = 'INV-' . $commission->year . '-' . str_pad($commission->month, 2, '0', STR_PAD_LEFT) . '-' . str_pad($commission->id, 5, '0', STR_PAD_LEFT);
        }

        $html = view('emails.commission-invoice', ['commission' => $commission])->render();
        return response($html, 200)->header('Content-Type', 'text/html');
    }

    public function markAllPaid(Request $request): JsonResponse
    {
        $request->validate([
            'year'  => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $count = ShopCommission::where('year',  $request->year)
            ->where('month', $request->month)
            ->where('status', 'pending')
            ->update(['status' => 'paid', 'paid_at' => now()]);

        return response()->json(['message' => "{$count} commission(s) marked as paid."]);
    }

    // Mark all pending for a whole year as paid
    public function markAllPaidYear(Request $request): JsonResponse
    {
        $request->validate(['year' => 'required|integer']);

        $count = ShopCommission::where('year', $request->year)
            ->where('status', 'pending')
            ->update(['status' => 'paid', 'paid_at' => now()]);

        return response()->json(['message' => "{$count} commission(s) marked as paid for {$request->year}."]);
    }

    // Send invoices to all unsent commissions for a whole year
    public function sendAllInvoicesYear(Request $request): JsonResponse
    {
        $request->validate(['year' => 'required|integer']);

        $commissions = ShopCommission::with('shop.owner')
            ->where('year', $request->year)
            ->whereNull('invoice_sent_at')
            ->get();

        $sent = 0; $failed = 0;

        foreach ($commissions as $commission) {
            $invoiceNumber = 'INV-' . $commission->year . '-' . str_pad($commission->month, 2, '0', STR_PAD_LEFT) . '-' . str_pad($commission->id, 5, '0', STR_PAD_LEFT);
            $commission->update(['invoice_sent_at' => now(), 'invoice_number' => $invoiceNumber]);

            $owner = $commission->shop?->owner;
            if ($owner?->email) {
                try {
                    Mail::to($owner->email)->send(new CommissionInvoiceMail($commission));
                    $sent++;
                } catch (\Throwable) { $failed++; }
            }
        }

        return response()->json([
            'message' => "Invoices sent: {$sent}. Failed: {$failed}.",
            'sent'    => $sent,
            'failed'  => $failed,
        ]);
    }
}
