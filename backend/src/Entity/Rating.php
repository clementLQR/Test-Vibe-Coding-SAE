<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\RatingRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A subscriber's rating of an article block, from 0 to 5 stars (brief). One per user and block.
 */
#[ORM\Entity(repositoryClass: RatingRepository::class)]
#[ORM\UniqueConstraint(columns: ['user_id', 'block_id'])]
class Rating
{
    public const MIN = 0;
    public const MAX = 5;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Block $block;

    #[ORM\Column(type: Types::SMALLINT)]
    private int $score;

    #[ORM\Column]
    private \DateTimeImmutable $ratedAt;

    public function __construct(User $user, Block $block, int $score)
    {
        $this->user = $user;
        $this->block = $block;
        $this->score = $score;
        $this->ratedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getBlock(): Block
    {
        return $this->block;
    }

    public function getScore(): int
    {
        return $this->score;
    }

    public function changeScore(int $score): void
    {
        $this->score = $score;
        $this->ratedAt = new \DateTimeImmutable();
    }
}
