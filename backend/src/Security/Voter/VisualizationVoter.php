<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\User;
use App\Entity\Visualization;
use App\Security\Role;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * VISUALIZATION_EDIT: its creator, or an editor. Every author can reuse any chart in an article.
 *
 * @extends Voter<string, Visualization>
 */
final class VisualizationVoter extends Voter
{
    public const EDIT = 'VISUALIZATION_EDIT';

    public function __construct(private readonly Security $security)
    {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return self::EDIT === $attribute && $subject instanceof Visualization;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        return $this->security->isGranted(Role::EDITOR)
            || ($this->security->isGranted(Role::AUTHOR) && $subject->getCreatedBy() === $user);
    }
}
