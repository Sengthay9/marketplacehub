<?php

return [
    'driver' => 'argon2id',

    'bcrypt' => [
        'rounds' => env('BCRYPT_ROUNDS', 12),
    ],

    'argon' => [
        'memory'  => 65536,
        'threads' => 1,
        'time'    => 4,
    ],
];
