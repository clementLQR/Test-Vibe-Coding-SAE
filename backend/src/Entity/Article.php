<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\ExactFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\QueryParameter;
use App\Article\ArticleStatus;
use App\Article\ArticleType;
use App\Article\BlockContainer;
use App\Dto\ArticleInput;
use App\Repository\ArticleRepository;
use App\State\ArticleWriteProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * An article: title, summary and ordered blocks. Written as a whole (blocks included)
 * through ArticleInput; see App\Article\ArticleWriter for the rules.
 */
#[ORM\Entity(repositoryClass: ArticleRepository::class)]
#[ORM\Index(columns: ['translation_key'])]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    operations: [
        // Visitors only get published articles (see ArticleVisibilityExtension)
        new GetCollection(
            order: ['updatedAt' => 'DESC'],
            parameters: [
                'status' => new QueryParameter(filter: new ExactFilter()),
                'type' => new QueryParameter(filter: new ExactFilter()),
                'locale' => new QueryParameter(filter: new ExactFilter()),
            ],
        ),
        new Get(security: "is_granted('ARTICLE_VIEW', object)"),
        new Post(input: ArticleInput::class, processor: ArticleWriteProcessor::class, security: "is_granted('ARTICLE_CREATE')"),
        new Put(input: ArticleInput::class, processor: ArticleWriteProcessor::class, security: "is_granted('ARTICLE_EDIT', object)"),
        new Delete(security: "is_granted('ARTICLE_EDIT', object)"),
    ],
    normalizationContext: ['groups' => ['content:read']],
    paginationItemsPerPage: 20,
)]
class Article implements BlockContainer
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['content:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 200)]
    #[Groups(['content:read'])]
    private string $title = '';

    #[ORM\Column(length: 220, unique: true)]
    #[Groups(['content:read'])]
    private string $slug = '';

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['content:read'])]
    private string $summary = '';

    #[ORM\Column(length: 12, enumType: ArticleType::class)]
    #[Groups(['content:read'])]
    private ArticleType $type = ArticleType::Classic;

    #[ORM\Column(length: 12, enumType: ArticleStatus::class)]
    #[Groups(['content:read'])]
    private ArticleStatus $status = ArticleStatus::Draft;

    #[ORM\Column(length: 2)]
    #[Groups(['content:read'])]
    private string $locale = 'fr';

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $author;

    /** @var Collection<int, Block> */
    #[ORM\OneToMany(targetEntity: Block::class, mappedBy: 'article', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC'])]
    #[Groups(['content:read'])]
    private Collection $blocks;

    #[ORM\Column]
    #[Groups(['content:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    #[Groups(['content:read'])]
    private \DateTimeImmutable $updatedAt;

    #[ORM\Column(nullable: true)]
    #[Groups(['content:read'])]
    private ?\DateTimeImmutable $publishedAt = null;

    /** Shared by the versions of the same article in different languages. */
    #[ORM\Column(length: 32, nullable: true)]
    #[Groups(['content:read'])]
    private ?string $translationKey = null;

    public function __construct(?User $author)
    {
        $this->author = $author;
        $this->blocks = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = $this->createdAt;
    }

    #[ORM\PreUpdate]
    public function touch(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

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

    public function getSlug(): string
    {
        return $this->slug;
    }

    public function setSlug(string $slug): static
    {
        $this->slug = $slug;

        return $this;
    }

    public function getSummary(): string
    {
        return $this->summary;
    }

    public function setSummary(string $summary): static
    {
        $this->summary = trim($summary);

        return $this;
    }

    public function getType(): ArticleType
    {
        return $this->type;
    }

    public function setType(ArticleType $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getStatus(): ArticleStatus
    {
        return $this->status;
    }

    public function setStatus(ArticleStatus $status): static
    {
        if (ArticleStatus::Published === $status && null === $this->publishedAt) {
            $this->publishedAt = new \DateTimeImmutable();
        }
        $this->status = $status;

        return $this;
    }

    public function isPublished(): bool
    {
        return ArticleStatus::Published === $this->status;
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

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    #[Groups(['content:read'])]
    public function getAuthorId(): ?int
    {
        return $this->author?->getId();
    }

    #[Groups(['content:read'])]
    public function getAuthorName(): ?string
    {
        return $this->author?->getDisplayName();
    }

    /** @return Collection<int, Block> */
    public function getBlocks(): Collection
    {
        return $this->blocks;
    }

    public function addBlock(Block $block): static
    {
        if (!$this->blocks->contains($block)) {
            $this->blocks->add($block);
        }

        return $this;
    }

    public function removeBlock(Block $block): static
    {
        $this->blocks->removeElement($block);

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getTranslationKey(): ?string
    {
        return $this->translationKey;
    }

    public function setTranslationKey(?string $translationKey): static
    {
        $this->translationKey = $translationKey;

        return $this;
    }

    public function getPublishedAt(): ?\DateTimeImmutable
    {
        return $this->publishedAt;
    }
}
