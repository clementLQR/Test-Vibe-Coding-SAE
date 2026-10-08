<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Article;
use App\Entity\Block;
use App\Entity\Media;
use App\Entity\Visualization;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Article>
 */
class ArticleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Article::class);
    }

    public function slugExists(string $slug, ?int $exceptId): bool
    {
        $qb = $this->createQueryBuilder('a')->select('COUNT(a.id)')->where('a.slug = :slug')->setParameter('slug', $slug);
        if (null !== $exceptId) {
            $qb->andWhere('a.id != :id')->setParameter('id', $exceptId);
        }

        return (int) $qb->getQuery()->getSingleScalarResult() > 0;
    }

    /**
     * Titles of the articles and pages whose blocks use this media or visualization.
     *
     * @return list<string>
     */
    public function titlesUsing(Media|Visualization $item): array
    {
        $field = $item instanceof Media ? 'media' : 'visualization';

        /** @var list<string> $titles */
        $titles = $this->getEntityManager()->createQueryBuilder()
            ->select('DISTINCT COALESCE(a.title, p.title)')
            ->from(Block::class, 'b')
            ->leftJoin('b.article', 'a')
            ->leftJoin('b.page', 'p')
            ->where("b.$field = :item")
            ->setParameter('item', $item)
            ->getQuery()
            ->getSingleColumnResult();

        return $titles;
    }
}
