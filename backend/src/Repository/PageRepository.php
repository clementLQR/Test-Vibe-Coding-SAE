<?php

declare(strict_types=1);

namespace App\Repository;

use App\Article\ArticleStatus;
use App\Entity\Page;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Page>
 */
class PageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Page::class);
    }

    public function slugExists(string $slug, ?int $exceptId): bool
    {
        $qb = $this->createQueryBuilder('p')->select('COUNT(p.id)')->where('p.slug = :slug')->setParameter('slug', $slug);
        if (null !== $exceptId) {
            $qb->andWhere('p.id != :id')->setParameter('id', $exceptId);
        }

        return (int) $qb->getQuery()->getSingleScalarResult() > 0;
    }

    /**
     * Published pages shown in the menu of a language.
     *
     * @return list<Page>
     */
    public function menu(string $locale): array
    {
        /** @var list<Page> $pages */
        $pages = $this->createQueryBuilder('p')
            ->where('p.status = :published')
            ->andWhere('p.showInMenu = true')
            ->andWhere('p.locale = :locale')
            ->setParameter('published', ArticleStatus::Published)
            ->setParameter('locale', $locale)
            ->orderBy('p.menuOrder', 'ASC')
            ->addOrderBy('p.title', 'ASC')
            ->getQuery()
            ->getResult();

        return $pages;
    }
}
