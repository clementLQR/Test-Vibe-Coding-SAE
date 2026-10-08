<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Singleton: background of the interactive map. Either an OpenStreetMap map centred
 * on the event, or an image of the venue plan from the media library.
 */
#[ORM\Entity]
class MapConfig
{
    public const MODES = ['osm', 'image'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 10)]
    private string $mode = 'osm';

    #[ORM\Column]
    private float $centerLat = 47.3941;

    #[ORM\Column]
    private float $centerLng = 0.6848;

    #[ORM\Column]
    private int $zoom = 15;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'RESTRICT')]
    private ?Media $backgroundImage = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getMode(): string
    {
        return $this->mode;
    }

    public function getCenterLat(): float
    {
        return $this->centerLat;
    }

    public function getCenterLng(): float
    {
        return $this->centerLng;
    }

    public function getZoom(): int
    {
        return $this->zoom;
    }

    public function getBackgroundImage(): ?Media
    {
        return $this->backgroundImage;
    }

    public function update(string $mode, float $centerLat, float $centerLng, int $zoom, ?Media $backgroundImage): void
    {
        $this->mode = $mode;
        $this->centerLat = $centerLat;
        $this->centerLng = $centerLng;
        $this->zoom = $zoom;
        $this->backgroundImage = $backgroundImage;
    }
}
