<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Lightweight probe used by the front end and Docker health checks.
 */
final class HealthController
{
    public function __construct(
        #[Autowire('%app.version%')]
        private readonly string $version,
    ) {
    }

    #[Route('/api/health', name: 'api_health', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        return new JsonResponse(['status' => 'ok', 'version' => $this->version]);
    }
}
