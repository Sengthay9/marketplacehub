<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Commission Invoice</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; color: #1a1a1a; }
    .wrapper { max-width: 680px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }

    /* Header */
    .header { background: #0f172a; padding: 36px 40px; display: flex; justify-content: space-between; align-items: center; }
    .brand   { color: #fff; font-size: 20px; font-weight: 800; letter-spacing: -.3px; }
    .badge   { background: #334155; color: #94a3b8; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; letter-spacing: .5px; text-transform: uppercase; }

    /* Invoice meta */
    .meta    { padding: 32px 40px 0; display: flex; justify-content: space-between; align-items: flex-start; }
    .invoice-title { font-size: 28px; font-weight: 900; color: #0f172a; }
    .invoice-num   { font-size: 12px; color: #64748b; margin-top: 4px; }
    .meta-right    { text-align: right; }
    .meta-right p  { font-size: 13px; color: #64748b; line-height: 1.6; }
    .meta-right strong { color: #1a1a1a; }

    /* Parties */
    .parties { padding: 24px 40px; display: flex; gap: 32px; }
    .party   { flex: 1; background: #f8fafc; border-radius: 12px; padding: 20px; }
    .party-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px; }
    .party-name  { font-size: 15px; font-weight: 700; color: #0f172a; }
    .party-info  { font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.5; }

    /* Table */
    .table-wrap { padding: 0 40px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: #f1f5f9; }
    th { padding: 12px 16px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #64748b; }
    th:last-child, td:last-child { text-align: right; }
    td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; color: #374151; }
    tr:last-child td { border-bottom: none; }

    /* Totals */
    .totals { margin: 0 40px; border-top: 2px solid #f1f5f9; padding: 20px 0; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #64748b; }
    .total-row.final { font-size: 17px; font-weight: 900; color: #0f172a; border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 14px; }
    .amount-due { color: #16a34a; }

    /* Status */
    .status-row { padding: 20px 40px; display: flex; align-items: center; gap: 12px; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .status-pending { background: #fef9c3; color: #854d0e; }
    .status-paid    { background: #dcfce7; color: #166534; }

    /* Due date banner */
    .due-banner { margin: 0 40px 24px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px 20px; font-size: 13px; color: #1d4ed8; }
    .due-banner strong { font-weight: 700; }

    /* Footer */
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.6; }
    .footer a { color: #6366f1; text-decoration: none; }
  </style>
</head>
<body>
<div class="wrapper">

  {{-- Header --}}
  <div class="header">
    <div class="brand">🛍️ CamCart</div>
    <div class="badge">Commission Invoice</div>
  </div>

  {{-- Invoice meta --}}
  @php
    $months   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    $period   = $months[$commission->month - 1] . ' ' . $commission->year;
    $dueDate  = now()->addDays(14)->format('d M Y');
    $sentDate = now()->format('d M Y');
  @endphp

  <div class="meta">
    <div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-num">{{ $commission->invoice_number }}</div>
    </div>
    <div class="meta-right">
      <p>Date issued: <strong>{{ $sentDate }}</strong></p>
      <p>Due date:    <strong>{{ $dueDate }}</strong></p>
      <p>Period:      <strong>{{ $period }}</strong></p>
    </div>
  </div>

  {{-- Parties --}}
  <div class="parties">
    <div class="party">
      <div class="party-label">From (Platform)</div>
      <div class="party-name">CamCart</div>
      <div class="party-info">
        noreply@camcart.com<br>
        {{ env('FRONTEND_URL', 'http://localhost') }}
      </div>
    </div>
    <div class="party">
      <div class="party-label">Bill To (Vendor)</div>
      <div class="party-name">{{ $commission->shop->name ?? 'Shop #' . $commission->shop_id }}</div>
      <div class="party-info">
        {{ $commission->shop->owner->name ?? '—' }}<br>
        {{ $commission->shop->owner->email ?? '—' }}<br>
        @if($commission->shop->contact_number)
          {{ $commission->shop->contact_number }}
        @endif
      </div>
    </div>
  </div>

  {{-- Line items table --}}
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Period</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Gross Revenue — {{ $commission->shop->name ?? 'Shop #' . $commission->shop_id }}</td>
          <td>{{ $period }}</td>
          <td>—</td>
          <td>${{ number_format($commission->gross_revenue, 2) }}</td>
        </tr>
        <tr>
          <td><strong>Platform Commission Fee</strong></td>
          <td>{{ $period }}</td>
          <td>{{ intval($commission->commission_rate * 100) }}%</td>
          <td><strong>${{ number_format($commission->commission_amount, 2) }}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  {{-- Totals --}}
  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>${{ number_format($commission->commission_amount, 2) }}</span>
    </div>
    <div class="total-row">
      <span>Tax</span>
      <span>$0.00</span>
    </div>
    <div class="total-row final">
      <span>Amount Due</span>
      <span class="amount-due">${{ number_format($commission->commission_amount, 2) }}</span>
    </div>
  </div>

  {{-- Status --}}
  <div class="status-row">
    <span>Payment Status:</span>
    @if($commission->status === 'paid')
      <span class="status-badge status-paid">✓ Paid{{ $commission->paid_at ? ' on ' . $commission->paid_at->format('d M Y') : '' }}</span>
    @else
      <span class="status-badge status-pending">⏳ Payment Pending</span>
    @endif
  </div>

  {{-- Due date notice --}}
  @if($commission->status !== 'paid')
  <div class="due-banner">
    <strong>Payment due by {{ $dueDate }}.</strong>
    Please transfer the commission amount to the platform account.
    Contact <a href="mailto:noreply@camcart.com">noreply@camcart.com</a> for payment instructions.
  </div>
  @endif

  {{-- Footer --}}
  <div class="footer">
    <p>
      This invoice was generated automatically by CamCart.<br>
      Questions? Contact us at <a href="mailto:noreply@camcart.com">noreply@camcart.com</a>
    </p>
  </div>

</div>
</body>
</html>
