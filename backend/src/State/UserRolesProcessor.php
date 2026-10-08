<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use App\Security\RoleChangeGuard;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * Persists role changes made through PATCH /api/users/{id}, refusing an administrator lock-out.
 *
 * @implements ProcessorInterface<User, User>
 */
final class UserRolesProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface<User, User> $persistProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly RoleChangeGuard $guard,
        private readonly TranslatorInterface $translator,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): User
    {
        $previous = $context['previous_data'] ?? null;
        $reason = $this->guard->refusalReason($data, $previous instanceof User ? $previous->getAssignedRoles() : []);
        if (null !== $reason) {
            throw new UnprocessableEntityHttpException($this->translator->trans($reason));
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
