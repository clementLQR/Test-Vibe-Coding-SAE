<?php

declare(strict_types=1);

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Article\ArticleStatus;
use App\Entity\Article;
use App\Entity\User;
use App\Security\Role;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Article list: editors see everything, authors see published articles and their own,
 * everybody else only sees published articles.
 */
final class ArticleVisibilityExtension implements QueryCollectionExtensionInterface
{
    public function __construct(private readonly Security $security)
    {
    }

    public function applyToCollection(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        if (Article::class !== $resourceClass || $this->security->isGranted(Role::EDITOR)) {
            return;
        }

        $alias = $queryBuilder->getRootAliases()[0];
        $status = $queryNameGenerator->generateParameterName('status');
        $condition = sprintf('%s.status = :%s', $alias, $status);
        $queryBuilder->setParameter($status, ArticleStatus::Published);

        $user = $this->security->getUser();
        if ($user instanceof User && $this->security->isGranted(Role::AUTHOR)) {
            $author = $queryNameGenerator->generateParameterName('author');
            $condition = sprintf('(%s OR %s.author = :%s)', $condition, $alias, $author);
            $queryBuilder->setParameter($author, $user);
        }

        $queryBuilder->andWhere($condition);
    }
}
