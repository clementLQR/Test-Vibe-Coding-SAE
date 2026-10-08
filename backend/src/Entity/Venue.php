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

/**
 * A place of the event: stage, room, area of stands, start line…
 * Program slots happen in a venue; map items can point to it.
 */
#[ORM\Entity]
#[ApiResource(
    operations: [
        new GetCollection(order: ['position' => 'ASC', 'name' => 'ASC']),
        new Get(),
        new Post(security: "is_granted('ROLE_EDITOR')"),
        new Patch(security: "is_granted('ROLE_EDITOR')"),
        new Delete(security: "is_granted('ROLE_EDITOR')"),
    ],
    normalizationContext: ['groups' => ['venue:read']],
    denormalizationContext: ['groups' => ['venue:write']],
    paginationEnabled: false,
)]
class Venue
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['venue:read', 'program:read', 'map:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 120)]
    #[Groups(['venue:read', 'venue:write', 'program:read', 'map:read'])]
    private string $name = '';

    #[ORM\Column(length: 1000, nullable: true)]
    #[Assert\Length(max: 1000)]
    #[Groups(['venue:read', 'venue:write'])]
    private ?string $description = null;

    #[ORM\Column(length: 7)]
    #[Assert\Regex(pattern: '/^#[0-9a-fA-F]{6}$/', message: 'visualization.colors.invalid')]
    #[Groups(['venue:read', 'venue:write', 'program:read', 'map:read'])]
    private string $color = '#1d4ed8';

    #[ORM\Column]
    #[Assert\Range(min: 0, max: 999)]
    #[Groups(['venue:read', 'venue:write'])]
    private int $position = 0;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = trim($name);

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

    public function getColor(): string
    {
        return $this->color;
    }

    public function setColor(string $color): static
    {
        $this->color = $color;

        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): static
    {
        $this->position = $position;

        return $this;
    }
}
