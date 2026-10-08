<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\TooManyLoginAttemptsAuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

final class JsonLoginFailureHandler implements AuthenticationFailureHandlerInterface
{
    public function __construct(private readonly TranslatorInterface $translator)
    {
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): JsonResponse
    {
        if ($exception instanceof TooManyLoginAttemptsAuthenticationException) {
            return new JsonResponse(
                ['message' => $this->translator->trans('auth.too_many_attempts')],
                Response::HTTP_TOO_MANY_REQUESTS,
            );
        }

        return new JsonResponse(
            ['message' => $this->translator->trans('auth.invalid_credentials')],
            Response::HTTP_UNAUTHORIZED,
        );
    }
}
