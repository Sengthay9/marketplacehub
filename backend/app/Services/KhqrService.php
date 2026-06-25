<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Generates KHQR strings matching bakong-khqr==0.1.4 (Python reference implementation).
 * Source: https://pypi.org/project/bakong-khqr/0.1.4/
 *
 * Tag order (must match exactly for CRC to be valid):
 *   00 payload_format_indicator
 *   01 point_of_initiation (12 = dynamic)
 *   29 merchant_account_info → sub-tag 00: bank_account (e.g. 85512345678@bakong)
 *   52 MCC (5999)
 *   58 country_code (KH)
 *   59 merchant_name
 *   60 merchant_city
 *   99 timestamp → sub-tag 00: epoch milliseconds
 *   54 amount
 *   53 currency (840=USD, 116=KHR)
 *   62 additional_data → 01 bill_number, 02 mobile_number, 03 store_label, 07 terminal_label
 *   63 CRC-16
 */
class KhqrService
{
    private const COUNTRY     = 'KH';
    private const DEFAULT_MCC = '5999';
    private const CHECK_URL   = 'https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5';

    private function tlv(string $tag, string $value): string
    {
        return $tag . str_pad(strlen($value), 2, '0', STR_PAD_LEFT) . $value;
    }

    private function crc16(string $data): string
    {
        $crc = 0xFFFF;
        for ($i = 0; $i < strlen($data); $i++) {
            $crc ^= ord($data[$i]) << 8;
            for ($j = 0; $j < 8; $j++) {
                $crc = ($crc & 0x8000) ? (($crc << 1) ^ 0x1021) : ($crc << 1);
                $crc &= 0xFFFF;
            }
        }
        return strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
    }

    /**
     * Normalize to digits-only without '+': 85512345678
     */
    private function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/[\s\-\(\)\+]+/', '', $phone);
        if (str_starts_with($phone, '0')) {
            return '855' . substr($phone, 1);
        }
        if (!str_starts_with($phone, '855')) {
            return '855' . $phone;
        }
        return $phone;
    }

    /**
     * Generate a KHQR string matching bakong-khqr==0.1.4 output exactly.
     *
     * @param string      $phone         Bakong phone (any format — auto-normalized)
     * @param string      $merchantName  Shown in banking app (max 25 chars)
     * @param float|null  $amount        null = static (no amount); value = dynamic with amount
     * @param string      $currency      'USD' or 'KHR'
     * @param string      $city          Merchant city (max 15 chars)
     * @param string|null $storeLabel    Tag 62.03 (max 25 chars)
     * @param string|null $billNumber    Tag 62.01 — order/invoice number (max 25 chars)
     * @param string|null $terminalLabel Tag 62.07 (max 25 chars)
     */
    public function generate(
        string  $phone,
        string  $merchantName,
        ?float  $amount        = null,
        string  $currency      = 'USD',
        string  $city          = 'Phnom Penh',
        ?string $storeLabel    = null,
        ?string $billNumber    = null,
        ?string $terminalLabel = null,
    ): string {
        $normalizedPhone = $this->normalizePhone($phone);
        $bankAccount     = $normalizedPhone . '@bakong';
        $name            = mb_strimwidth(trim($merchantName), 0, 25);
        $cityTrunc       = mb_strimwidth(trim($city), 0, 15);

        // ── 00: Payload Format Indicator ─────────────────────────────────────
        $payload  = $this->tlv('00', '01');

        // ── 01: Point of Initiation (12 = dynamic, 11 = static) ─────────────
        $payload .= $this->tlv('01', $amount !== null ? '12' : '11');

        // ── 29: Merchant Account Information — sub-tag 00: bank_account ──────
        // Python lib: tag29 → sub-tag 00 = bank_account (no GUID sub-tag)
        $payload .= $this->tlv('29', $this->tlv('00', $bankAccount));

        // ── 52: Merchant Category Code ────────────────────────────────────────
        $payload .= $this->tlv('52', self::DEFAULT_MCC);

        // ── 58: Country Code ─────────────────────────────────────────────────
        $payload .= $this->tlv('58', self::COUNTRY);

        // ── 59: Merchant Name ────────────────────────────────────────────────
        $payload .= $this->tlv('59', $name);

        // ── 60: Merchant City ────────────────────────────────────────────────
        $payload .= $this->tlv('60', $cityTrunc);

        // ── 99: Timestamp — sub-tag 00: epoch milliseconds ───────────────────
        $timestampMs = (string) (int) (microtime(true) * 1000);
        $payload .= $this->tlv('99', $this->tlv('00', $timestampMs));

        // ── 54: Transaction Amount ────────────────────────────────────────────
        if ($amount !== null) {
            $payload .= $this->tlv('54', number_format($amount, 2, '.', ''));
        }

        // ── 53: Transaction Currency ──────────────────────────────────────────
        $payload .= $this->tlv('53', $currency === 'KHR' ? '116' : '840');

        // ── 62: Additional Data Field Template ───────────────────────────────
        // Tag order matches Python lib: 01 bill, 02 phone, 03 store, 07 terminal
        $additional  = '';
        $additional .= $this->tlv('01', mb_strimwidth($billNumber    ?? 'N/A',         0, 25)); // bill_number
        $additional .= $this->tlv('02', mb_strimwidth($normalizedPhone,                0, 25)); // mobile_number (sub-tag 02, NOT 22)
        $additional .= $this->tlv('03', mb_strimwidth($storeLabel    ?? $name,         0, 25)); // store_label
        $additional .= $this->tlv('07', mb_strimwidth($terminalLabel ?? 'Order Payment',0, 25)); // terminal_label
        $payload .= $this->tlv('62', $additional);

        // ── 63: CRC-16 ────────────────────────────────────────────────────────
        $payload .= '6304';
        $payload .= $this->crc16($payload);

        return $payload;
    }

    /**
     * Send money from CamCart's Bakong account to a vendor's Bakong phone.
     * Requires Bakong Business/Merchant API access (separate from the check token).
     * Token must be stored in admin_bank_accounts.bakong_transfer_token.
     *
     * Returns transaction reference on success, null on failure.
     */
    public function transferToVendor(
        string $fromPhone,
        string $toPhone,
        float  $amount,
        string $currency,
        string $reference,
        string $transferToken,
    ): ?string {
        $toAccount   = $this->normalizePhone($toPhone) . '@bakong';
        $fromAccount = $this->normalizePhone($fromPhone) . '@bakong';

        try {
            $response = Http::timeout(15)
                ->acceptJson()
                ->withToken($transferToken)
                ->post('https://api-bakong.nbc.gov.kh/v1/initiate_bakong_khqr_payment', [
                    'sourceAccountId'      => $fromAccount,
                    'destinationAccountId' => $toAccount,
                    'amount'               => $amount,
                    'currency'             => $currency === 'KHR' ? 'KHR' : 'USD',
                    'description'          => $reference,
                ]);

            $body = $response->json();

            if ($response->successful() && ($body['responseCode'] ?? -1) === 0) {
                return $body['data']['externalRef']
                    ?? $body['data']['hash']
                    ?? $reference;
            }

            Log::warning('Bakong transfer failed', [
                'to'     => $toAccount,
                'amount' => $amount,
                'status' => $response->status(),
                'body'   => $body,
            ]);

            return null;

        } catch (\Throwable $e) {
            Log::warning('Bakong transfer exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Check if a KHQR payment was completed on the Bakong network.
     * Calls: POST https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5
     * Returns transaction data array if paid, null if not paid yet.
     */
    public function checkPayment(string $khqrString): ?array
    {
        $md5 = $this->md5Hash($khqrString);

        try {
            $request = Http::timeout(10)->acceptJson();

            $token = config('services.bakong.token');
            if ($token) {
                $request = $request->withToken($token);
            }

            $response = $request->post(self::CHECK_URL, ['md5' => $md5]);

            if (!$response->successful()) {
                Log::warning('Bakong checkPayment HTTP error', ['status' => $response->status()]);
                return null;
            }

            $body = $response->json();

            if (($body['responseCode'] ?? -1) === 0 && !empty($body['data'])) {
                return $body['data'];
            }

            return null;

        } catch (\Throwable $e) {
            Log::warning('Bakong checkPayment exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Check payment by MD5 hash directly (when the KHQR string is not available,
     * e.g. the MD5 was stored at dynamic QR generation time and sent by the frontend).
     */
    public function checkPaymentByMd5(string $md5): ?array
    {
        try {
            $request = Http::timeout(10)->acceptJson();
            $token = config('services.bakong.token');
            if ($token) {
                $request = $request->withToken($token);
            }
            $response = $request->post(self::CHECK_URL, ['md5' => $md5]);
            if (!$response->successful()) {
                Log::warning('Bakong checkPaymentByMd5 HTTP error', ['status' => $response->status()]);
                return null;
            }
            $body = $response->json();
            if (($body['responseCode'] ?? -1) === 0 && !empty($body['data'])) {
                return $body['data'];
            }
            return null;
        } catch (\Throwable $e) {
            Log::warning('Bakong checkPaymentByMd5 exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * MD5 hash of a KHQR string — used as the transaction fingerprint for check_payment.
     */
    public function md5Hash(string $khqrString): string
    {
        return md5($khqrString);
    }

    public function canGenerate(?string $phone): bool
    {
        return !empty(trim($phone ?? ''));
    }
}
