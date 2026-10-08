<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

/**
 * An element of the interactive map: a point (stage, toilets, first aid…) or a zone
 * (camping, parking…). Coordinates are [lat, lng] on a real map, [y, x] on an image plan.
 */
#[ORM\Entity]
#[ApiResource(
    operations: [
        new GetCollection(order: ['label' => 'ASC']),
        new Get(),
        new Post(security: "is_granted('ROLE_EDITOR')"),
        new Patch(security: "is_granted('ROLE_EDITOR')"),
        new Delete(security: "is_granted('ROLE_EDITOR')"),
    ],
    normalizationContext: ['groups' => ['map:read']],
    denormalizationContext: ['groups' => ['map:write']],
    paginationEnabled: false,
)]
class MapItem
{
    public const KINDS = ['point', 'zone'];
    private const MAX_POINTS = 100;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['map:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 120)]
    #[Groups(['map:read', 'map:write'])]
    private string $label = '';

    #[ORM\Column(length: 1000, nullable: true)]
    #[Assert\Length(max: 1000)]
    #[Groups(['map:read', 'map:write'])]
    private ?string $description = null;

    #[ORM\Column(length: 10)]
    #[Assert\Choice(choices: self::KINDS)]
    #[Groups(['map:read', 'map:write'])]
    private string $kind = 'point';

    /** @var list<array{0: float, 1: float}> one pair for a point, at least three for a zone */
    #[ORM\Column]
    #[Groups(['map:read', 'map:write'])]
    private array $coordinates = [];

    #[ORM\Column(length: 7)]
    #[Assert\Regex(pattern: '/^#[0-9a-fA-F]{6}$/', message: 'visualization.colors.invalid')]
    #[Groups(['map:read', 'map:write'])]
    private string $color = '#dc2626';

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['map:read', 'map:write'])]
    private ?Venue $venue = null;

    #[Assert\Callback]
    public function validateCoordinates(ExecutionContextInterface $context): void
    {
        $pairs = $this->coordinates;
        $countOk = 'point' === $this->kind ? 1 === \count($pairs) : \count($pairs) >= 3 && \count($pairs) <= self::MAX_POINTS;
        $valid = $countOk && array_is_list($pairs) && [] === array_filter(
            $pairs,
            static fn (mixed $pair): bool => !\is_array($pair) || 2 !== \count($pair) || !array_is_list($pair)
                || !(\is_int($pair[0]) || \is_float($pair[0])) || !(\is_int($pair[1]) || \is_float($pair[1]))
                || !is_finite((float) $pair[0]) || !is_finite((float) $pair[1]),
        );
        if (!$valid) {
            $context->buildViolation('point' === $this->kind ? 'map.point.invalid' : 'map.zone.invalid')
                ->atPath('coordinates')
                ->addViolation();
        }
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function setLabel(string $label): static
    {
        $this->label = trim($label);

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = null === $description || '' === trim($description) ? null : trim($description);

        return $this;
    }

    public function getKind(): string
    {
        return $this->kind;
    }

    public function setKind(string $kind): static
    {
        $this->kind = $kind;

        return $this;
    }

    /** @return list<array{0: float, 1: float}> */
    public function getCoordinates(): array
    {
        return $this->coordinates;
    }

    /** @param list<array{0: float, 1: float}> $coordinates */
    public function setCoordinates(array $coordinates): static
    {
        $this->coordinates = $coordinates;

        return $this;
    }

    public function getColor(): string
    {
        return $this->color;
    }

    public function setColor(string $color): static
    {
        $this->color = $color;

        return $this;
    }

    public function getVenue(): ?Venue
    {
        return $this->venue;
    }

    public function setVenue(?Venue $venue): static
    {
        $this->venue = $venue;

        return $this;
    }
}
