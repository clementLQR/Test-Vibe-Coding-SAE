<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Dataset;
use App\Entity\User;
use App\Security\Role;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * DATASET_LIST: see the list (data providers: all; authors: validated ones, to build charts).
 * DATASET_CREATE: import a data set (data providers).
 * DATASET_VIEW: see one data set's description.
 * DATASET_MANAGE: preview, edit variables, validate, delete (its provider or an admin).
 * DATASET_DATA: read the typed rows (anyone once validated: they feed published charts).
 *
 * @extends Voter<string, Dataset|null>
 */
final class DatasetVoter extends Voter
{
    public const LIST = 'DATASET_LIST';
    public const CREATE = 'DATASET_CREATE';
    public const VIEW = 'DATASET_VIEW';
    public const MANAGE = 'DATASET_MANAGE';
    public const DATA = 'DATASET_DATA';

    public function __construct(private readonly Security $security)
    {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return match ($attribute) {
            self::LIST, self::CREATE => true,
            self::VIEW, self::MANAGE, self::DATA => $subject instanceof Dataset,
            default => false,
        };
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $isProvider = $this->security->isGranted(Role::DATA_PROVIDER);
        $isAuthor = $this->security->isGranted(Role::AUTHOR);

        if (self::DATA === $attribute && $subject instanceof Dataset && $subject->isValidated()) {
            return true;
        }

        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        return match ($attribute) {
            self::LIST => $isProvider || $isAuthor,
            self::CREATE => $isProvider,
            self::VIEW, self::DATA => $isProvider || ($isAuthor && $subject instanceof Dataset && $subject->isValidated()),
            self::MANAGE => $this->security->isGranted(Role::ADMIN)
                || ($isProvider && $subject instanceof Dataset && $subject->getProvider() === $user),
            default => false,
        };
    }
}
