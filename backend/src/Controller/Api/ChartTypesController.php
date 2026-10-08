<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Chart\ChartTypeRegistry;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class ChartTypesController
{
    /** Chart types with their roles and options: the front end builds the chart editor from it. */
    #[Route('/api/chart-types', name: 'api_chart_types', methods: ['GET'])]
    public function __invoke(ChartTypeRegistry $registry): JsonResponse
    {
        return (new JsonResponse($registry->describe()))->setPublic()->setMaxAge(3600);
    }
}
