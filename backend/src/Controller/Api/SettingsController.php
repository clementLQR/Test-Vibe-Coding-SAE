<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Repository\SiteSettingsRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class SettingsController
{
    /** Public site information (name, event dates, place) used by the layout. */
    #[Route('/api/settings', name: 'api_settings', methods: ['GET'])]
    public function __invoke(SiteSettingsRepository $repository): JsonResponse
    {
        $settings = $repository->findCurrent();
        if (null === $settings) {
            return new JsonResponse(null, Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse([
            'siteName' => $settings->getSiteName(),
            'tagline' => $settings->getTagline(),
            'eventStart' => $settings->getEventStart()?->format('Y-m-d'),
            'eventEnd' => $settings->getEventEnd()?->format('Y-m-d'),
            'location' => $settings->getLocation(),
            'defaultLocale' => $settings->getDefaultLocale(),
        ]);
    }
}
