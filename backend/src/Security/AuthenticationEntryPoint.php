<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\EntryPoint\AuthenticationEntryPointInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * Anonymous access to a protected area: JSON 401 for the API,
 * redirect to the React login page for the EasyAdmin back-office.
 */
final class AuthenticationEntryPoint implements AuthenticationEntryPointInterface
{
    public function __construct(private readonly TranslatorInterface $translator)
    {
    }

    public function start(Request $request, ?AuthenticationException $authException = null): Response
    {
        if (str_starts_with($request->getPathInfo(), '/api')) {
            return new JsonResponse(
                ['message' => $this->translator->trans('auth.required')],
                Response::HTTP_UNAUTHORIZED,
            );
        }

        return new RedirectResponse('/login?redirect='.rawurlencode($request->getRequestUri()));
    }
}
