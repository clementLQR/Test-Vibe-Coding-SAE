<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Article\ArticleStatus;
use App\Article\BlockContainer;
use App\Dto\PageInput;
use App\Repository\PageRepository;
use App\State\PageWriteProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * A page of the event site (e.g. "Practical information", "Contact"), made of blocks
 * like an article, and optionally listed in the main menu. Managed by editors.
 */
#[ORM\Entity(repositoryClass: PageRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    operations: [
        // Visitors only get published pages (see PageVisibilityExtension)
        new GetCollection(order: ['menuOrder' => 'ASC', 'title' => 'ASC']),
        new Get(security: "is_granted('PAGE_VIEW', object)"),
        new Post(input: PageInput::class, processor: PageWriteProcessor::class, security: "is_granted('PAGE_EDIT')"),
        new Put(input: PageInput::class, processor: PageWriteProcessor::class, security: "is_granted('PAGE_EDIT')"),
        new Delete(security: "is_granted('PAGE_EDIT')"),
    ],
    normalizationContext: ['groups' => ['content:read']],
    paginationEnabled: false,
)]
class Page implements BlockContainer
{
    public const TEMPLATES = ['blank', 'contact'];

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

    /** "contact" adds the event practical information (dates, place) under the blocks. */
    #[ORM\Column(length: 20)]
    #[Groups(['content:read'])]
    private string $template = 'blank';

    #[ORM\Column(length: 12, enumType: ArticleStatus::class)]
    #[Groups(['content:read'])]
    private ArticleStatus $status = ArticleStatus::Draft;

    #[ORM\Column]
    #[Groups(['content:read'])]
    private bool $showInMenu = true;

    #[ORM\Column]
    #[Groups(['content:read'])]
    private int $menuOrder = 0;

    #[ORM\Column(length: 2)]
    #[Groups(['content:read'])]
    private string $locale = 'fr';

    /** @var Collection<int, Block> */
    #[ORM\OneToMany(targetEntity: Block::class, mappedBy: 'page', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['position' => \SortDirection::Ascending])]
    #[Groups(['content:read'])]
    private Collection $blocks;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $publishedAt = null;

    #[ORM\Column]
    #[Groups(['content:read'])]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $this->blocks = new ArrayCollection();
        $this->updatedAt = new \DateTimeImmutable();
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

    public function getTemplate(): string
    {
        return $this->template;
    }

    public function setTemplate(string $template): static
    {
        $this->template = $template;

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

    public function getPublishedAt(): ?\DateTimeImmutable
    {
        return $this->publishedAt;
    }

    public function isShowInMenu(): bool
    {
        return $this->showInMenu;
    }

    public function setShowInMenu(bool $showInMenu): static
    {
        $this->showInMenu = $showInMenu;

        return $this;
    }

    public function getMenuOrder(): int
    {
        return $this->menuOrder;
    }

    public function setMenuOrder(int $menuOrder): static
    {
        $this->menuOrder = $menuOrder;

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

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
