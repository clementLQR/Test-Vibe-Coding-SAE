<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;

final class JsonLoginSuccessHandler implements AuthenticationSuccessHandlerInterface
{
    public function __construct(private readonly UserPresenter $presenter)
    {
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token): JsonResponse
    {
        $user = $token->getUser();
        \assert($user instanceof User);

        return new JsonResponse(['user' => $this->presenter->present($user)]);
    }
}
