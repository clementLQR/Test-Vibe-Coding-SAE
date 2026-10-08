<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Chart\Validator\ValidVisualization;
use App\Repository\VisualizationRepository;
use App\State\InUseGuardProcessor;
use App\State\VisualizationCreateProcessor;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * A chart: a data set, a chart type, the variables mapped to the chart roles,
 * colors and options. Only these parameters are stored (brief): the data is read
 * from the data set when the chart is displayed.
 */
#[ORM\Entity(repositoryClass: VisualizationRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ValidVisualization]
#[ApiResource(
    operations: [
        new GetCollection(order: ['updatedAt' => 'DESC'], security: "is_granted('ROLE_AUTHOR')"),
        // Public: published articles display their charts to visitors
        new Get(),
        new Post(security: "is_granted('ROLE_AUTHOR')", processor: VisualizationCreateProcessor::class),
        new Patch(security: "is_granted('VISUALIZATION_EDIT', object)"),
        new Delete(security: "is_granted('VISUALIZATION_EDIT', object)", processor: InUseGuardProcessor::class),
    ],
    normalizationContext: ['groups' => ['visualization:read']],
    denormalizationContext: ['groups' => ['visualization:write']],
)]
class Visualization
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['visualization:read', 'content:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 160)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 160)]
    #[Groups(['visualization:read', 'visualization:write', 'content:read'])]
    private string $title = '';

    /** Text alternative of the chart (accessibility): what it shows, in one or two sentences. */
    #[ORM\Column(type: Types::TEXT)]
    #[Assert\NotBlank(message: 'visualization.description.required')]
    #[Assert\Length(max: 1000)]
    #[Groups(['visualization:read', 'visualization:write', 'content:read'])]
    private string $description = '';

    #[ORM\Column(length: 30)]
    #[Groups(['visualization:read', 'visualization:write', 'content:read'])]
    private string $chartType = '';

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    #[Assert\NotNull]
    #[Groups(['visualization:read', 'visualization:write', 'content:read'])]
    // Null only until validation (NotNull) refuses it: never persisted without a data set
    /** @phpstan-ignore doctrine.associationType */
    private ?Dataset $dataset = null;

    /** @var array<string, string> chart role => variable name (CSV column) */
    #[ORM\Column]
    #[Groups(['visualization:read', 'visualization:write', 'content:read'])]
    private array $mapping = [];

    /** @var list<string> palette, "#rrggbb" */
    #[ORM\Column]
    #[Groups(['visualization:read', 'visualization:write', 'content:read'])]
    private array $colors = [];

    /** @var array<string, mixed> */
    #[ORM\Column]
    #[Groups(['visualization:read', 'visualization:write', 'content:read'])]
    private array $options = [];

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $createdBy = null;

    #[ORM\Column]
    #[Groups(['visualization:read', 'content:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    #[Groups(['visualization:read', 'content:read'])]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
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

    public function getDescription(): string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = trim($description);

        return $this;
    }

    public function getChartType(): string
    {
        return $this->chartType;
    }

    public function setChartType(string $chartType): static
    {
        $this->chartType = $chartType;

        return $this;
    }

    public function getDataset(): ?Dataset
    {
        return $this->dataset;
    }

    public function setDataset(?Dataset $dataset): static
    {
        $this->dataset = $dataset;

        return $this;
    }

    #[Groups(['visualization:read', 'content:read'])]
    public function getDatasetId(): ?int
    {
        return $this->dataset?->getId();
    }

    /** @return array<string, string> */
    public function getMapping(): array
    {
        return $this->mapping;
    }

    /** @param array<string, string> $mapping */
    public function setMapping(array $mapping): static
    {
        // Empty optional roles are simply absent
        $this->mapping = array_filter($mapping, static fn (mixed $variable): bool => \is_string($variable) && '' !== $variable);

        return $this;
    }

    /** @return list<string> */
    public function getColors(): array
    {
        return $this->colors;
    }

    /** @param list<string> $colors */
    public function setColors(array $colors): static
    {
        $this->colors = array_values($colors);

        return $this;
    }

    /** @return array<string, mixed> */
    public function getOptions(): array
    {
        return $this->options;
    }

    /** @param array<string, mixed> $options */
    public function setOptions(array $options): static
    {
        $this->options = $options;

        return $this;
    }

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): static
    {
        $this->createdBy = $createdBy;

        return $this;
    }

    #[Groups(['visualization:read', 'content:read'])]
    public function getCreatedById(): ?int
    {
        return $this->createdBy?->getId();
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
