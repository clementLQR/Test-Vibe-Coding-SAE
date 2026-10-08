<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Entity\MapConfig;
use App\Entity\Media;
use App\Security\Role;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * GET (public) and PUT (editors) the single map configuration.
 */
#[Route('/api/map-config')]
final class MapConfigController extends AbstractController
{
    public function __construct(private readonly EntityManagerInterface $em)
    {
    }

    #[Route('', name: 'api_map_config', methods: ['GET'])]
    public function show(): JsonResponse
    {
        return new JsonResponse($this->present($this->current()));
    }

    /** Body {mode: "osm"|"image", centerLat, centerLng, zoom, backgroundMediaId}. */
    #[Route('', name: 'api_map_config_update', methods: ['PUT'])]
    public function update(Request $request, TranslatorInterface $translator): JsonResponse
    {
        $this->denyAccessUnlessGranted(Role::EDITOR);
        $input = $request->toArray();

        $violations = [];
        $mode = $input['mode'] ?? null;
        if (!\in_array($mode, MapConfig::MODES, true)) {
            $violations['mode'] = 'map.config.mode';
        }
        $lat = $input['centerLat'] ?? null;
        $lng = $input['centerLng'] ?? null;
        if (!is_numeric($lat) || $lat < -90 || $lat > 90 || !is_numeric($lng) || $lng < -180 || $lng > 180) {
            $violations['centerLat'] = 'map.config.center';
        }
        $zoom = $input['zoom'] ?? null;
        if (!\is_int($zoom) || $zoom < 1 || $zoom > 19) {
            $violations['zoom'] = 'map.config.zoom';
        }
        $media = isset($input['backgroundMediaId']) ? $this->em->find(Media::class, (int) $input['backgroundMediaId']) : null;
        if ('image' === $mode && null === $media) {
            $violations['backgroundMediaId'] = 'map.config.image_required';
        }

        if ([] !== $violations) {
            $list = [];
            foreach ($violations as $path => $key) {
                $list[] = ['propertyPath' => $path, 'message' => $translator->trans($key, domain: 'validators')];
            }

            return new JsonResponse(['violations' => $list], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        \assert(\is_string($mode) && \is_int($zoom));
        $config = $this->current();
        $config->update($mode, (float) $lat, (float) $lng, $zoom, 'image' === $mode ? $media : null);
        $this->em->persist($config);
        $this->em->flush();

        return new JsonResponse($this->present($config));
    }

    private function current(): MapConfig
    {
        return $this->em->getRepository(MapConfig::class)->findOneBy([], ['id' => 'ASC']) ?? new MapConfig();
    }

    /**
     * @return array<string, mixed>
     */
    private function present(MapConfig $config): array
    {
        $image = $config->getBackgroundImage();

        return [
            'mode' => $config->getMode(),
            'centerLat' => $config->getCenterLat(),
            'centerLng' => $config->getCenterLng(),
            'zoom' => $config->getZoom(),
            'background' => null === $image ? null : [
                'mediaId' => $image->getId(),
                'url' => $image->getUrl(),
                'width' => $image->getWidth(),
                'height' => $image->getHeight(),
                'altFr' => $image->getAltFr(),
                'altEn' => $image->getAltEn(),
            ],
        ];
    }
}
