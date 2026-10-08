<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\FreeTextQueryFilter;
use ApiPlatform\Doctrine\Orm\Filter\OrFilter;
use ApiPlatform\Doctrine\Orm\Filter\PartialSearchFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\QueryParameter;
use App\Repository\MediaRepository;
use App\State\InUseGuardProcessor;
use App\State\MediaUploadProcessor;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * An image of the media library. Only optimised WebP variants are kept on disk.
 */
#[ORM\Entity(repositoryClass: MediaRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(
            order: ['createdAt' => 'DESC'],
            security: "is_granted('MEDIA_LIBRARY')",
            parameters: [
                'q' => new QueryParameter(
                    filter: new FreeTextQueryFilter(new OrFilter(new PartialSearchFilter())),
                    properties: ['originalName', 'altFr', 'altEn'],
                ),
            ],
        ),
        new Get(security: "is_granted('MEDIA_LIBRARY')"),
        new Post(
            processor: MediaUploadProcessor::class,
            security: "is_granted('MEDIA_LIBRARY')",
            deserialize: false,
            validate: false,
        ),
        new Patch(
            denormalizationContext: ['groups' => ['media:write']],
            security: "is_granted('MEDIA_EDIT', object)",
        ),
        new Delete(security: "is_granted('MEDIA_EDIT', object)", processor: InUseGuardProcessor::class),
    ],
    normalizationContext: ['groups' => ['media:read']],
    paginationItemsPerPage: 24,
)]
class Media
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['media:read', 'article:read'])]
    private ?int $id = null;

    /** Base name of the stored files, without extension (random, unguessable). */
    #[ORM\Column(length: 64, unique: true)]
    private string $storageKey;

    #[ORM\Column(length: 255)]
    #[Groups(['media:read', 'article:read'])]
    private string $originalName;

    #[ORM\Column(length: 50)]
    #[Groups(['media:read', 'article:read'])]
    private string $mimeType = 'image/webp';

    /** Size in bytes of the main WebP variant. */
    #[ORM\Column]
    #[Groups(['media:read', 'article:read'])]
    private int $size;

    #[ORM\Column]
    #[Groups(['media:read', 'article:read'])]
    private int $width;

    #[ORM\Column]
    #[Groups(['media:read', 'article:read'])]
    private int $height;

    #[ORM\Column(length: 255)]
    #[Assert\Length(max: 255)]
    #[Groups(['media:read', 'media:write', 'article:read'])]
    private string $altFr = '';

    #[ORM\Column(length: 255)]
    #[Assert\Length(max: 255)]
    #[Groups(['media:read', 'media:write', 'article:read'])]
    private string $altEn = '';

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $uploadedBy;

    #[ORM\Column]
    #[Groups(['media:read', 'article:read'])]
    private \DateTimeImmutable $createdAt;

    public function __construct(string $storageKey, string $originalName, int $size, int $width, int $height, ?User $uploadedBy)
    {
        $this->storageKey = $storageKey;
        $this->originalName = $originalName;
        $this->size = $size;
        $this->width = $width;
        $this->height = $height;
        $this->uploadedBy = $uploadedBy;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getStorageKey(): string
    {
        return $this->storageKey;
    }

    public function getOriginalName(): string
    {
        return $this->originalName;
    }

    public function getMimeType(): string
    {
        return $this->mimeType;
    }

    public function getSize(): int
    {
        return $this->size;
    }

    public function getWidth(): int
    {
        return $this->width;
    }

    public function getHeight(): int
    {
        return $this->height;
    }

    public function getAltFr(): string
    {
        return $this->altFr;
    }

    public function setAltFr(string $altFr): static
    {
        $this->altFr = trim($altFr);

        return $this;
    }

    public function getAltEn(): string
    {
        return $this->altEn;
    }

    public function setAltEn(string $altEn): static
    {
        $this->altEn = trim($altEn);

        return $this;
    }

    /** True when both alternative texts are filled: required before insertion in an article. */
    #[Groups(['media:read', 'article:read'])]
    public function isAltComplete(): bool
    {
        return '' !== $this->altFr && '' !== $this->altEn;
    }

    public function getUploadedBy(): ?User
    {
        return $this->uploadedBy;
    }

    #[Groups(['media:read', 'article:read'])]
    public function getUploadedByName(): ?string
    {
        return $this->uploadedBy?->getDisplayName();
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    #[Groups(['media:read', 'article:read'])]
    public function getUrl(): string
    {
        return '/uploads/media/'.$this->storageKey.'.webp';
    }

    #[Groups(['media:read', 'article:read'])]
    public function getThumbnailUrl(): string
    {
        return '/uploads/media/'.$this->storageKey.'-thumb.webp';
    }
}
