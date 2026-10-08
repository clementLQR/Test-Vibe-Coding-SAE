<?php

declare(strict_types=1);

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Dataset\DatasetStatus;
use App\Entity\Dataset;
use App\Security\Role;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Users who are not data providers (authors) only see validated data sets in the list.
 */
final class ValidatedDatasetsExtension implements QueryCollectionExtensionInterface
{
    public function __construct(private readonly Security $security)
    {
    }

    public function applyToCollection(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        if (Dataset::class !== $resourceClass || $this->security->isGranted(Role::DATA_PROVIDER)) {
            return;
        }

        $alias = $queryBuilder->getRootAliases()[0];
        $parameter = $queryNameGenerator->generateParameterName('status');
        $queryBuilder->andWhere(sprintf('%s.status = :%s', $alias, $parameter))
            ->setParameter($parameter, DatasetStatus::Validated);
    }
}
