<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\ThemeRepository;
use App\State\ThemeWriteProcessor;
use App\Theme\ThemeScope;
use App\Theme\ThemeStatus;
use App\Theme\ThemeTokens;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

/**
 * A stylistic overlay (CSS variables) proposed by a designer for the whole site,
 * a page or an article, then approved or rejected by an administrator.
 */
#[ORM\Entity(repositoryClass: ThemeRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    operations: [
        new GetCollection(order: ['updatedAt' => 'DESC'], security: "is_granted('ROLE_DESIGNER')"),
        new Get(security: "is_granted('ROLE_DESIGNER')"),
        new Post(security: "is_granted('ROLE_DESIGNER')", processor: ThemeWriteProcessor::class),
        new Patch(security: "is_granted('THEME_EDIT', object)", processor: ThemeWriteProcessor::class),
        new Delete(security: "is_granted('THEME_EDIT', object)"),
    ],
    normalizationContext: ['groups' => ['theme:read']],
    denormalizationContext: ['groups' => ['theme:write']],
    paginationEnabled: false,
)]
class Theme
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['theme:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 120)]
    #[Groups(['theme:read', 'theme:write'])]
    private string $name = '';

    #[ORM\Column(length: 10, enumType: ThemeScope::class)]
    #[Groups(['theme:read', 'theme:write'])]
    private ThemeScope $scope = ThemeScope::Site;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    #[Groups(['theme:read', 'theme:write'])]
    private ?Page $page = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    #[Groups(['theme:read', 'theme:write'])]
    private ?Article $article = null;

    /** @var array<string, mixed> see ThemeTokens::DEFINITIONS */
    #[ORM\Column]
    #[Groups(['theme:read', 'theme:write'])]
    private array $tokens = [];

    #[ORM\Column(length: 10, enumType: ThemeStatus::class)]
    #[Groups(['theme:read'])]
    private ThemeStatus $status = ThemeStatus::Proposed;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $proposedBy = null;

    #[ORM\Column(length: 1000, nullable: true)]
    #[Groups(['theme:read'])]
    private ?string $reviewComment = null;

    #[ORM\Column]
    #[Groups(['theme:read'])]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function touch(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[Assert\Callback]
    public function validate(ExecutionContextInterface $context): void
    {
        foreach (ThemeTokens::errors($this->tokens) as $token => $message) {
            $context->buildViolation($message)->atPath("tokens[$token]")->addViolation();
        }
        $target = match ($this->scope) {
            ThemeScope::Site => null === $this->page && null === $this->article,
            ThemeScope::Page => null !== $this->page && null === $this->article,
            ThemeScope::Article => null !== $this->article && null === $this->page,
        };
        if (!$target) {
            $context->buildViolation('theme.target.mismatch')->atPath($this->scope->value)->addViolation();
        }
    }

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

    public function getScope(): ThemeScope
    {
        return $this->scope;
    }

    public function setScope(ThemeScope $scope): static
    {
        $this->scope = $scope;

        return $this;
    }

    public function getPage(): ?Page
    {
        return $this->page;
    }

    public function setPage(?Page $page): static
    {
        $this->page = $page;

        return $this;
    }

    #[Groups(['theme:read'])]
    public function getPageId(): ?int
    {
        return $this->page?->getId();
    }

    public function getArticle(): ?Article
    {
        return $this->article;
    }

    public function setArticle(?Article $article): static
    {
        $this->article = $article;

        return $this;
    }

    #[Groups(['theme:read'])]
    public function getArticleId(): ?int
    {
        return $this->article?->getId();
    }

    /** Title of the targeted page or article, for the review list. */
    #[Groups(['theme:read'])]
    public function getTargetTitle(): ?string
    {
        return $this->page?->getTitle() ?? $this->article?->getTitle();
    }

    /** @return array<string, mixed> */
    public function getTokens(): array
    {
        return $this->tokens;
    }

    /** @param array<string, mixed> $tokens */
    public function setTokens(array $tokens): static
    {
        $this->tokens = $tokens;

        return $this;
    }

    public function getStatus(): ThemeStatus
    {
        return $this->status;
    }

    public function setStatus(ThemeStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getProposedBy(): ?User
    {
        return $this->proposedBy;
    }

    public function setProposedBy(?User $proposedBy): static
    {
        $this->proposedBy = $proposedBy;

        return $this;
    }

    #[Groups(['theme:read'])]
    public function getProposedById(): ?int
    {
        return $this->proposedBy?->getId();
    }

    #[Groups(['theme:read'])]
    public function getProposedByName(): ?string
    {
        return $this->proposedBy?->getDisplayName();
    }

    public function getReviewComment(): ?string
    {
        return $this->reviewComment;
    }

    public function setReviewComment(?string $reviewComment): static
    {
        $this->reviewComment = $reviewComment;

        return $this;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
