<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'     => 'required|string|min:2|max:100',
            'username' => 'required|string|min:3|max:30|alpha_dash|unique:users,username',
            'email'    => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone'    => 'required|string|max:20',
            'role'     => 'nullable|in:customer,vendor',
        ];
    }
}
