<?php

declare(strict_types=1);

namespace App\Entity;

use App\Article\BlockContainer;
use App\Article\BlockType;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * A block of an article or of a page: a heading (levels 2 to 4), a text (restricted Markdown),
 * an image of the media library or a visualization.
 * Media and visualizations in use cannot be deleted (RESTRICT).
 */
#[ORM\Entity]
class Block
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['content:read'])]
    private ?int $id = null;

    /** Exactly one of article and page is set, guaranteed by the constructor (MySQL refuses CHECK constraints on cascading foreign keys). */
    #[ORM\ManyToOne(inversedBy: 'blocks')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    private ?Article $article = null;

    #[ORM\ManyToOne(inversedBy: 'blocks')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    private ?Page $page = null;

    #[ORM\Column]
    #[Groups(['content:read'])]
    private int $position = 0;

    #[ORM\Column(length: 15, enumType: BlockType::class)]
    #[Groups(['content:read'])]
    private BlockType $type;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    #[Groups(['content:read'])]
    private ?int $headingLevel = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['content:read'])]
    private ?string $text = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'RESTRICT')]
    #[Groups(['content:read'])]
    private ?Media $media = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'RESTRICT')]
    #[Groups(['content:read'])]
    private ?Visualization $visualization = null;

    public function __construct(BlockContainer $owner, BlockType $type)
    {
        if ($owner instanceof Article) {
            $this->article = $owner;
        } elseif ($owner instanceof Page) {
            $this->page = $owner;
        }
        $this->type = $type;
        $owner->addBlock($this);
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getArticle(): ?Article
    {
        return $this->article;
    }

    public function getPage(): ?Page
    {
        return $this->page;
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
