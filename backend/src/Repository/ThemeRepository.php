<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Theme;
use App\Theme\ThemeStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Theme>
 */
class ThemeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Theme::class);
    }

    /** @return list<Theme> */
    public function findActive(): array
    {
        return $this->findBy(['status' => ThemeStatus::Active]);
    }

    /** The other active theme on the same target (site, page or article), if any. */
    public function activeSameTarget(Theme $theme): ?Theme
    {
        $qb = $this->createQueryBuilder('t')
            ->where('t.status = :active')
            ->andWhere('t.scope = :scope')
            ->andWhere('t.id != :id')
            ->setParameter('active', ThemeStatus::Active)
            ->setParameter('scope', $theme->getScope())
            ->setParameter('id', $theme->getId());
        foreach (['page' => $theme->getPage(), 'article' => $theme->getArticle()] as $field => $target) {
            null === $target
                ? $qb->andWhere("t.$field IS NULL")
                : $qb->andWhere("t.$field = :$field")->setParameter($field, $target);
        }

        return $qb->setMaxResults(1)->getQuery()->getOneOrNullResult();
    }
}
