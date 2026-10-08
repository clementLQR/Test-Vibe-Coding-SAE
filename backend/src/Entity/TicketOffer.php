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
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * A ticket offer shown on the ticketing page. Evently does not sell tickets:
 * each offer links to the organiser's ticketing service.
 */
#[ORM\Entity]
#[ApiResource(
    operations: [
        new GetCollection(
            order: ['position' => 'ASC', 'priceCents' => 'ASC'],
            parameters: ['locale' => new QueryParameter(filter: new ExactFilter())],
        ),
        new Get(),
        new Post(security: "is_granted('ROLE_EDITOR')"),
        new Patch(security: "is_granted('ROLE_EDITOR')"),
        new Delete(security: "is_granted('ROLE_EDITOR')"),
    ],
    normalizationContext: ['groups' => ['ticket:read']],
    denormalizationContext: ['groups' => ['ticket:write']],
    paginationEnabled: false,
)]
class TicketOffer
{
    public const AVAILABILITIES = ['available', 'soon', 'sold_out'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ticket:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 120)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private string $name = '';

    #[ORM\Column(length: 1000, nullable: true)]
    #[Assert\Length(max: 1000)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private ?string $description = null;

    /** Price in cents (no float rounding on money). */
    #[ORM\Column]
    #[Assert\Range(min: 0, max: 100_000_000)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private int $priceCents = 0;

    #[ORM\Column(length: 3)]
    #[Assert\Choice(choices: ['EUR', 'USD', 'GBP', 'CHF'])]
    #[Groups(['ticket:read', 'ticket:write'])]
    private string $currency = 'EUR';

    #[ORM\Column(length: 2048, nullable: true)]
    #[Assert\Url(protocols: ['https', 'http'], requireTld: true)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private ?string $externalUrl = null;

    #[ORM\Column(length: 10)]
    #[Assert\Choice(choices: self::AVAILABILITIES)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private string $availability = 'available';

    #[ORM\Column]
    #[Assert\Range(min: 0, max: 999)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private int $position = 0;

    #[ORM\Column(length: 2)]
    #[Assert\Choice(choices: ['fr', 'en'])]
    #[Groups(['ticket:read', 'ticket:write'])]
    private string $locale = 'fr';

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

    public function getPriceCents(): int
    {
        return $this->priceCents;
    }

    public function setPriceCents(int $priceCents): static
    {
        $this->priceCents = $priceCents;

        return $this;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function setCurrency(string $currency): static
    {
        $this->currency = $currency;

        return $this;
    }

    public function getExternalUrl(): ?string
    {
        return $this->externalUrl;
    }

    public function setExternalUrl(?string $externalUrl): static
    {
        $this->externalUrl = null === $externalUrl || '' === trim($externalUrl) ? null : trim($externalUrl);

        return $this;
    }

    public function getAvailability(): string
    {
        return $this->availability;
    }

    public function setAvailability(string $availability): static
    {
        $this->availability = $availability;

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

    public function getLocale(): string
    {
        return $this->locale;
    }

    public function setLocale(string $locale): static
    {
        $this->locale = $locale;

        return $this;
    }
}
