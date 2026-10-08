<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Article;
use App\Entity\Block;
use App\Entity\Rating;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Rating>
 */
class RatingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Rating::class);
    }

    /**
     * Average, count and the given user's score for every rated block of an article (one query each).
     *
     * @return array<int, array{average: float, count: int, mine: int|null}> keyed by block id
     */
    public function summaryForArticle(Article $article, ?User $user): array
    {
        /** @var list<array{blockId: int|string, average: float|string, count: int|string}> $rows */
        $rows = $this->createQueryBuilder('r')
            ->select('IDENTITY(r.block) AS blockId', 'AVG(r.score) AS average', 'COUNT(r.id) AS count')
            ->join('r.block', 'b')
            ->where('b.article = :article')
            ->groupBy('r.block')
            ->setParameter('article', $article)
            ->getQuery()
            ->getArrayResult();

        $summary = [];
        foreach ($rows as $row) {
            $summary[(int) $row['blockId']] = ['average' => round((float) $row['average'], 1), 'count' => (int) $row['count'], 'mine' => null];
        }

        if (null !== $user) {
            /** @var list<array{blockId: int|string, score: int|string}> $mine */
            $mine = $this->createQueryBuilder('r')
                ->select('IDENTITY(r.block) AS blockId', 'r.score AS score')
                ->join('r.block', 'b')
                ->where('b.article = :article')
                ->andWhere('r.user = :user')
                ->setParameter('article', $article)
                ->setParameter('user', $user)
                ->getQuery()
                ->getArrayResult();
            foreach ($mine as $row) {
                if (isset($summary[(int) $row['blockId']])) {
                    $summary[(int) $row['blockId']]['mine'] = (int) $row['score'];
                }
            }
        }

        return $summary;
    }

    /**
     * @return array{average: float, count: int}
     */
    public function summaryForBlock(Block $block): array
    {
        /** @var array{average: float|string|null, count: int|string} $row */
        $row = $this->createQueryBuilder('r')
            ->select('AVG(r.score) AS average', 'COUNT(r.id) AS count')
            ->where('r.block = :block')
            ->setParameter('block', $block)
            ->getQuery()
            ->getSingleResult();

        return ['average' => round((float) $row['average'], 1), 'count' => (int) $row['count']];
    }
}
