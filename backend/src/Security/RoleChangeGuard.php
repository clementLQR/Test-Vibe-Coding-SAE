<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Prevents an administrator lock-out when roles change (API and EasyAdmin alike).
 */
final class RoleChangeGuard
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly Security $security,
    ) {
    }

    /**
     * Must be called before flushing, while the database still holds the previous roles.
     *
     * @param list<string> $previousRoles
     *
     * @return string|null translation key of the refusal reason, or null when the change is allowed
     */
    public function refusalReason(User $user, array $previousRoles): ?string
    {
        $wasAdmin = \in_array(Role::ADMIN, $previousRoles, true);
        $isAdmin = \in_array(Role::ADMIN, $user->getAssignedRoles(), true);

        if (!$wasAdmin || $isAdmin) {
            return null;
        }
        if ($this->security->getUser() === $user) {
            return 'user.roles.cannot_demote_self';
        }
        if ($this->users->countAdmins() <= 1) {
            return 'user.roles.last_admin';
        }

        return null;
    }
}
