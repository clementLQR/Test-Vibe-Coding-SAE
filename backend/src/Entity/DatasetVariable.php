<?php

declare(strict_types=1);

namespace App\Entity;

use App\Dataset\VariableType;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * A column of a data set. Its type (categorical or numerical) is suggested by the
 * analysis and confirmed by the data provider; it drives which charts can use it.
 */
#[ORM\Entity]
#[ORM\UniqueConstraint(columns: ['dataset_id', 'column_index'])]
class DatasetVariable
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['dataset:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'variables')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Dataset $dataset;

    #[ORM\Column]
    #[Groups(['dataset:read'])]
    private int $columnIndex;

    /** Header of the column in the CSV: the stable reference used by visualizations. */
    #[ORM\Column(length: 255)]
    #[Groups(['dataset:read'])]
    private string $name;

    /** Human-readable label shown in charts, editable by the provider. */
    #[ORM\Column(length: 255)]
    #[Groups(['dataset:read'])]
    private string $label;

    #[ORM\Column(length: 12, enumType: VariableType::class)]
    #[Groups(['dataset:read'])]
    private VariableType $type;

    #[ORM\Column(length: 12, enumType: VariableType::class)]
    #[Groups(['dataset:read'])]
    private VariableType $detectedType;

    public function __construct(Dataset $dataset, int $columnIndex, string $name, VariableType $detectedType)
    {
        $this->dataset = $dataset;
        $this->columnIndex = $columnIndex;
        $this->name = $name;
        $this->label = $name;
        $this->type = $detectedType;
        $this->detectedType = $detectedType;
        $dataset->addVariable($this);
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDataset(): Dataset
    {
        return $this->dataset;
    }

    public function getColumnIndex(): int
    {
        return $this->columnIndex;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function setLabel(string $label): static
    {
        $label = trim($label);
        $this->label = '' === $label ? $this->name : mb_substr($label, 0, 255);

        return $this;
    }

    public function getType(): VariableType
    {
        return $this->type;
    }

    public function setType(VariableType $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getDetectedType(): VariableType
    {
        return $this->detectedType;
    }
}
