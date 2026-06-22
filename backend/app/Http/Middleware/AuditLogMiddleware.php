<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditLogMiddleware
{
    private const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (in_array($request->method(), self::AUDITED_METHODS) && $request->user()) {
            $status = $response->getStatusCode();
            if ($status < 500) {
                AuditLog::record($this->resolveEvent($request), [
                    'new_values' => $this->sanitize($request->except(['password', 'password_confirmation', 'current_password'])),
                ]);
            }
        }

        return $response;
    }

    private function resolveEvent(Request $request): string
    {
        $method = $request->method();
        $path   = $request->path();
        return strtolower($method) . ':' . $path;
    }

    private function sanitize(array $data): array
    {
        array_walk_recursive($data, function (&$value) {
            if (is_string($value)) {
                $value = strip_tags($value);
            }
        });
        return $data;
    }
}
