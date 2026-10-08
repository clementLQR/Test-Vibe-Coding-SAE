<?php

declare(strict_types=1);

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Payload of the installation wizard (POST /api/install).
 */
final class InstallRequest
{
    public function __construct(
        #[Assert\Choice(choices: ['fr', 'en'])]
        public readonly string $locale = 'fr',
        #[Assert\NotBlank]
        #[Assert\Length(max: 120)]
        public readonly string $siteName = '',
        #[Assert\Length(max: 255)]
        public readonly ?string $tagline = null,
        #[Assert\Date]
        public readonly ?string $eventStart = null,
        #[Assert\Date]
        public readonly ?string $eventEnd = null,
        #[Assert\Length(max: 255)]
        public readonly ?string $location = null,
        #[Assert\NotBlank]
        #[Assert\Email]
        public readonly string $adminEmail = '',
        #[Assert\NotBlank]
        #[Assert\Length(min: 10, max: 4096, minMessage: 'user.password.too_short')]
        public readonly string $adminPassword = '',
        #[Assert\NotBlank]
        #[Assert\Length(min: 2, max: 80)]
        public readonly string $adminDisplayName = '',
    ) {
    }
}
