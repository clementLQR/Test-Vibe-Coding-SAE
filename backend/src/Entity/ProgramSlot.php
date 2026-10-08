<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\ExactFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\QueryParameter;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * A slot of the program (concert, talk, race…). Times are the event's local wall-clock
 * time, exchanged as "YYYY-MM-DDTHH:MM" without time zone: 18:00 stays 18:00 for every visitor.
 */
#[ORM\Entity]
#[ApiResource(
    operations: [
        new GetCollection(
            order: ['startsAt' => 'ASC', 'title' => 'ASC'],
            parameters: ['locale' => new QueryParameter(filter: new ExactFilter())],
        ),
        new Get(),
        new Post(security: "is_granted('ROLE_EDITOR')"),
        new Patch(security: "is_granted('ROLE_EDITOR')"),
        new Delete(security: "is_granted('ROLE_EDITOR')"),
    ],
    normalizationContext: ['groups' => ['program:read']],
    denormalizationContext: ['groups' => ['program:write']],
    paginationEnabled: false,
)]
class ProgramSlot
{
    public const TIME_FORMAT = 'Y-m-d\TH:i';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['program:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 160)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 160)]
    #[Groups(['program:read', 'program:write'])]
    private string $title = '';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Assert\Length(max: 2000)]
    #[Groups(['program:read', 'program:write'])]
    private ?string $description = null;

    #[ORM\Column]
    #[Assert\NotNull]
    #[Context([DateTimeNormalizer::FORMAT_KEY => self::TIME_FORMAT])]
    #[Groups(['program:read', 'program:write'])]
    // Null only until validation (NotNull) refuses it: never persisted empty
    /** @phpstan-ignore doctrine.columnType */
    private ?\DateTimeImmutable $startsAt = null;

    #[ORM\Column]
    #[Assert\NotNull]
    #[Assert\GreaterThan(propertyPath: 'startsAt', message: 'program.ends_before_start')]
    #[Context([DateTimeNormalizer::FORMAT_KEY => self::TIME_FORMAT])]
    #[Groups(['program:read', 'program:write'])]
    /** @phpstan-ignore doctrine.columnType */
    private ?\DateTimeImmutable $endsAt = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['program:read', 'program:write'])]
    private ?Venue $venue = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\Length(max: 255)]
    #[Groups(['program:read', 'program:write'])]
    private ?string $speakers = null;

    #[ORM\Column(length: 60, nullable: true)]
    #[Assert\Length(max: 60)]
    #[Groups(['program:read', 'program:write'])]
    private ?string $category = null;

    #[ORM\Column(length: 2)]
    #[Assert\Choice(choices: ['fr', 'en'])]
    #[Groups(['program:read', 'program:write'])]
    private string $locale = 'fr';

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = trim($title);

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = self::nullIfBlank($description);

        return $this;
    }

    public function getStartsAt(): ?\DateTimeImmutable
    {
        return $this->startsAt;
    }

    public function setStartsAt(?\DateTimeImmutable $startsAt): static
    {
        $this->startsAt = $startsAt;

        return $this;
    }

    public function getEndsAt(): ?\DateTimeImmutable
    {
        return $this->endsAt;
    }

    public function setEndsAt(?\DateTimeImmutable $endsAt): static
    {
        $this->endsAt = $endsAt;

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

    public function getSpeakers(): ?string
    {
        return $this->speakers;
    }

    public function setSpeakers(?string $speakers): static
    {
        $this->speakers = self::nullIfBlank($speakers);

        return $this;
    }

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(?string $category): static
    {
        $this->category = self::nullIfBlank($category);

        return $this;
    }

    public function getLocale(): string
    {
        return $this->locale;
    }

    public function setLocale(string $locale): static
    {
        $this->locale = $locale;

        return $this;
    }

    private static function nullIfBlank(?string $value): ?string
    {
        return null === $value || '' === trim($value) ? null : trim($value);
    }
}
