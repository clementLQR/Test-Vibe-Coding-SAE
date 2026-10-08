<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Theme;
use App\Entity\User;
use App\Security\Role;
use App\Theme\ThemeStatus;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * THEME_EDIT: administrators, or the designer who proposed it while it is not live
 * (proposed or rejected). Approving and rejecting are for administrators only (ROLE_ADMIN).
 *
 * @extends Voter<string, Theme>
 */
final class ThemeVoter extends Voter
{
    public const EDIT = 'THEME_EDIT';

    public function __construct(private readonly Security $security)
    {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return self::EDIT === $attribute && $subject instanceof Theme;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        return $this->security->isGranted(Role::ADMIN)
            || ($this->security->isGranted(Role::DESIGNER)
                && $subject->getProposedBy() === $user
                && \in_array($subject->getStatus(), [ThemeStatus::Proposed, ThemeStatus::Rejected], true));
    }
}
