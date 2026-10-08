<?php

declare(strict_types=1);

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Article\ArticleStatus;
use App\Entity\Page;
use App\Security\Role;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Page list: editors see everything, everybody else only published pages.
 */
final class PageVisibilityExtension implements QueryCollectionExtensionInterface
{
    public function __construct(private readonly Security $security)
    {
    }

    public function applyToCollection(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        if (Page::class !== $resourceClass || $this->security->isGranted(Role::EDITOR)) {
            return;
        }

        $alias = $queryBuilder->getRootAliases()[0];
        $status = $queryNameGenerator->generateParameterName('status');
        $queryBuilder->andWhere(sprintf('%s.status = :%s', $alias, $status))->setParameter($status, ArticleStatus::Published);
    }
}
