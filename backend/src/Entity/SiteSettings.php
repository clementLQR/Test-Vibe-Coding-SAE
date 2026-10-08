<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\SiteSettingsRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Singleton row holding the event and site configuration, created by the installer.
 */
#[ORM\Entity(repositoryClass: SiteSettingsRepository::class)]
class SiteSettings
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 120)]
    private string $siteName = '';

    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\Length(max: 255)]
    private ?string $tagline = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $eventStart = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    #[Assert\GreaterThanOrEqual(propertyPath: 'eventStart', message: 'settings.event_end.before_start')]
    private ?\DateTimeImmutable $eventEnd = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\Length(max: 255)]
    private ?string $location = null;

    #[ORM\Column(length: 2)]
    #[Assert\Choice(choices: ['fr', 'en'])]
    private string $defaultLocale = 'fr';

    #[ORM\Column]
    private \DateTimeImmutable $installedAt;

    public function __construct()
    {
        $this->installedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSiteName(): string
    {
        return $this->siteName;
    }

    public function setSiteName(string $siteName): static
    {
        $this->siteName = trim($siteName);

        return $this;
    }

    public function getTagline(): ?string
    {
        return $this->tagline;
    }

    public function setTagline(?string $tagline): static
    {
        $this->tagline = $tagline;

        return $this;
    }

    public function getEventStart(): ?\DateTimeImmutable
    {
        return $this->eventStart;
    }

    public function setEventStart(?\DateTimeImmutable $eventStart): static
    {
        $this->eventStart = $eventStart;

        return $this;
    }

    public function getEventEnd(): ?\DateTimeImmutable
    {
        return $this->eventEnd;
    }

    public function setEventEnd(?\DateTimeImmutable $eventEnd): static
    {
        $this->eventEnd = $eventEnd;

        return $this;
    }

    public function getLocation(): ?string
    {
        return $this->location;
    }

    public function setLocation(?string $location): static
    {
        $this->location = $location;

        return $this;
    }

    public function getDefaultLocale(): string
    {
        return $this->defaultLocale;
    }

    public function setDefaultLocale(string $defaultLocale): static
    {
        $this->defaultLocale = $defaultLocale;

        return $this;
    }

    public function getInstalledAt(): \DateTimeImmutable
    {
        return $this->installedAt;
    }
}
