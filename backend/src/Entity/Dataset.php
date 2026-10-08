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
use App\Dataset\DatasetStatus;
use App\Dataset\SourceType;
use App\Repository\DatasetRepository;
use App\State\DatasetCreateProcessor;
use App\State\InUseGuardProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * A data set described by its source and its variables. The CSV content itself
 * is never stored in the database (brief requirement): it is read from the source on demand.
 */
#[ORM\Entity(repositoryClass: DatasetRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(
            order: ['createdAt' => 'DESC'],
            security: "is_granted('DATASET_LIST')",
            parameters: ['status' => new QueryParameter(filter: new ExactFilter())],
        ),
        new Get(security: "is_granted('DATASET_VIEW', object)"),
        new Post(
            processor: DatasetCreateProcessor::class,
            security: "is_granted('DATASET_CREATE')",
            deserialize: false,
            validate: false,
        ),
        new Patch(
            denormalizationContext: ['groups' => ['dataset:write']],
            security: "is_granted('DATASET_MANAGE', object)",
        ),
        new Delete(security: "is_granted('DATASET_MANAGE', object)", processor: InUseGuardProcessor::class),
    ],
    normalizationContext: ['groups' => ['dataset:read']],
    paginationItemsPerPage: 30,
)]
class Dataset
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['dataset:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 120)]
    #[Groups(['dataset:read', 'dataset:write'])]
    private string $name = '';

    #[ORM\Column(length: 1000, nullable: true)]
    #[Assert\Length(max: 1000)]
    #[Groups(['dataset:read', 'dataset:write'])]
    private ?string $description = null;

    #[ORM\Column(length: 10, enumType: SourceType::class)]
    #[Groups(['dataset:read'])]
    private SourceType $sourceType;

    /** File name in the dataset storage (file source) or remote URL (url source). */
    #[ORM\Column(length: 2048)]
    private string $sourceUri;

    #[ORM\Column(length: 1)]
    #[Groups(['dataset:read'])]
    private string $delimiter = ';';

    #[ORM\Column(length: 10, enumType: DatasetStatus::class)]
    #[Groups(['dataset:read'])]
    private DatasetStatus $status = DatasetStatus::Pending;

    /** Number of rows found at the last analysis. */
    #[ORM\Column(nullable: true)]
    #[Groups(['dataset:read'])]
    private ?int $rowCount = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $provider;

    /** @var Collection<int, DatasetVariable> */
    #[ORM\OneToMany(targetEntity: DatasetVariable::class, mappedBy: 'dataset', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['columnIndex' => 'ASC'])]
    #[Groups(['dataset:read'])]
    private Collection $variables;

    #[ORM\Column]
    #[Groups(['dataset:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    #[Groups(['dataset:read'])]
    private ?\DateTimeImmutable $validatedAt = null;

    public function __construct(SourceType $sourceType, string $sourceUri, ?User $provider)
    {
        $this->sourceType = $sourceType;
        $this->sourceUri = $sourceUri;
        $this->provider = $provider;
        $this->variables = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $description = null === $description ? null : trim($description);
        $this->description = '' === $description ? null : $description;

        return $this;
    }

    public function getSourceType(): SourceType
    {
        return $this->sourceType;
    }

    public function getSourceUri(): string
    {
        return $this->sourceUri;
    }

    /** The remote URL is shown to the user; a stored file name is internal. */
    #[Groups(['dataset:read'])]
    public function getSourceUrl(): ?string
    {
        return SourceType::Url === $this->sourceType ? $this->sourceUri : null;
    }

    public function getDelimiter(): string
    {
        return $this->delimiter;
    }

    public function getStatus(): DatasetStatus
    {
        return $this->status;
    }

    public function isValidated(): bool
    {
        return DatasetStatus::Validated === $this->status;
    }

    public function markValidated(): void
    {
        $this->status = DatasetStatus::Validated;
        $this->validatedAt = new \DateTimeImmutable();
    }

    public function getRowCount(): ?int
    {
        return $this->rowCount;
    }

    public function setRowCount(int $rowCount): static
    {
        $this->rowCount = $rowCount;

        return $this;
    }

    public function getProvider(): ?User
    {
        return $this->provider;
    }

    #[Groups(['dataset:read'])]
    public function getProviderId(): ?int
    {
        return $this->provider?->getId();
    }

    #[Groups(['dataset:read'])]
    public function getProviderName(): ?string
    {
        return $this->provider?->getDisplayName();
    }

    /** @return Collection<int, DatasetVariable> */
    public function getVariables(): Collection
    {
        return $this->variables;
    }

    public function addVariable(DatasetVariable $variable): static
    {
        if (!$this->variables->contains($variable)) {
            $this->variables->add($variable);
        }

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getValidatedAt(): ?\DateTimeImmutable
    {
        return $this->validatedAt;
    }
}
