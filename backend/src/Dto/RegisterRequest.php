<?php

declare(strict_types=1);

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final class RegisterRequest
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Email]
        public readonly string $email = '',
        #[Assert\NotBlank]
        #[Assert\Length(min: 10, max: 4096, minMessage: 'user.password.too_short')]
        public readonly string $password = '',
        #[Assert\NotBlank]
        #[Assert\Length(min: 2, max: 80)]
        public readonly string $displayName = '',
        #[Assert\Choice(choices: ['fr', 'en'])]
        public readonly string $locale = 'fr',
    ) {
    }
}
