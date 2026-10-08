<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\User;
use Symfony\Component\Security\Core\Role\RoleHierarchyInterface;

/**
 * JSON view of the current user for the front end, with the effective roles
 * (hierarchy expanded) so the UI never has to know the hierarchy.
 */
final class UserPresenter
{
    public function __construct(private readonly RoleHierarchyInterface $roleHierarchy)
    {
    }

    /**
     * @return array{id: int|null, email: string, displayName: string, locale: string, roles: list<string>}
     */
    public function present(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'displayName' => $user->getDisplayName(),
            'locale' => $user->getLocale(),
            'roles' => array_values(array_unique($this->roleHierarchy->getReachableRoleNames($user->getRoles()))),
        ];
    }
}
