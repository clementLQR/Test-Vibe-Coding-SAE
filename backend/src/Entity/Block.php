<?php

declare(strict_types=1);

namespace App\Entity;

use App\Article\BlockType;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * A block of an article: a heading (levels 2 to 4), a text (restricted Markdown),
 * an image of the media library or a visualization (dashboard articles only).
 * Media and visualizations in use cannot be deleted (RESTRICT).
 */
#[ORM\Entity]
class Block
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['article:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'blocks')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Article $article;

    #[ORM\Column]
    #[Groups(['article:read'])]
    private int $position = 0;

    #[ORM\Column(length: 15, enumType: BlockType::class)]
    #[Groups(['article:read'])]
    private BlockType $type;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    #[Groups(['article:read'])]
    private ?int $headingLevel = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['article:read'])]
    private ?string $text = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'RESTRICT')]
    #[Groups(['article:read'])]
    private ?Media $media = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'RESTRICT')]
    #[Groups(['article:read'])]
    private ?Visualization $visualization = null;

    public function __construct(Article $article, BlockType $type)
    {
        $this->article = $article;
        $this->type = $type;
        $article->addBlock($this);
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getArticle(): Article
    {
        return $this->article;
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

    public function getType(): BlockType
    {
        return $this->type;
    }

    /** Changing the type resets the content that belongs to the previous type. */
    public function setType(BlockType $type): static
    {
        if ($type !== $this->type) {
            $this->headingLevel = null;
            $this->text = null;
            $this->media = null;
            $this->visualization = null;
        }
        $this->type = $type;

        return $this;
    }

    public function getHeadingLevel(): ?int
    {
        return $this->headingLevel;
    }

    public function setHeadingLevel(?int $headingLevel): static
    {
        $this->headingLevel = $headingLevel;

        return $this;
    }

    public function getText(): ?string
    {
        return $this->text;
    }

    public function setText(?string $text): static
    {
        $this->text = $text;

        return $this;
    }

    public function getMedia(): ?Media
    {
        return $this->media;
    }

    public function setMedia(?Media $media): static
    {
        $this->media = $media;

        return $this;
    }

    public function getVisualization(): ?Visualization
    {
        return $this->visualization;
    }

    public function setVisualization(?Visualization $visualization): static
    {
        $this->visualization = $visualization;

        return $this;
    }
}
