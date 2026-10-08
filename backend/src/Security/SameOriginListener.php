<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * CSRF protection for the session-authenticated API: state-changing requests
 * must come from the same origin (checked with Sec-Fetch-Site, then Origin).
 * Runs after the locale listener (16) and before the firewall (8), so login and logout are protected too.
 */
#[AsEventListener(event: KernelEvents::REQUEST, priority: 15)]
final class SameOriginListener
{
    private const SAFE_FETCH_SITES = ['same-origin', 'none'];

    public function __construct(private readonly TranslatorInterface $translator)
    {
    }

    public function __invoke(RequestEvent $event): void
    {
        $request = $event->getRequest();
        if (!$event->isMainRequest() || $request->isMethodSafe() || !str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }

        $fetchSite = $request->headers->get('Sec-Fetch-Site');
        $origin = $request->headers->get('Origin');

        $crossSite = null !== $fetchSite
            ? !\in_array($fetchSite, self::SAFE_FETCH_SITES, true)
            : null !== $origin && $origin !== $request->getSchemeAndHttpHost();

        if ($crossSite) {
            $event->setResponse(new JsonResponse(
                ['message' => $this->translator->trans('auth.cross_origin')],
                Response::HTTP_FORBIDDEN,
            ));
        }
    }
}
