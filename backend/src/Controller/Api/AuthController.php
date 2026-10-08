<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Dto\RegisterRequest;
use App\Entity\User;
use App\Repository\SiteSettingsRepository;
use App\Security\UserPresenter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

#[Route('/api')]
final class AuthController extends AbstractController
{
    public function __construct(
        private readonly UserPresenter $presenter,
        private readonly TranslatorInterface $translator,
    ) {
    }

    /** Handled by the json_login authenticator; only reached when the payload is malformed. */
    #[Route('/login', name: 'api_login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        return new JsonResponse(['message' => $this->translator->trans('auth.invalid_credentials')], Response::HTTP_UNAUTHORIZED);
    }

    #[Route('/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(): never
    {
        throw new \LogicException('Intercepted by the logout key of the firewall.');
    }

    #[Route('/me', name: 'api_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();

        return new JsonResponse(['user' => $user instanceof User ? $this->presenter->present($user) : null]);
    }

    /** Public sign-up: creates a subscriber and logs them in. */
    #[Route('/register', name: 'api_register', methods: ['POST'])]
    public function register(
        #[MapRequestPayload] RegisterRequest $payload,
        SiteSettingsRepository $settings,
        UserPasswordHasherInterface $hasher,
        ValidatorInterface $validator,
        EntityManagerInterface $em,
        Security $security,
    ): JsonResponse {
        if (null === $settings->findCurrent()) {
            return new JsonResponse(['message' => $this->translator->trans('install.required')], Response::HTTP_CONFLICT);
        }

        $user = (new User())
            ->setEmail($payload->email)
            ->setDisplayName($payload->displayName)
            ->setLocale($payload->locale);
        $user->setPassword($hasher->hashPassword($user, $payload->password));

        $violations = $validator->validate($user);
        if (\count($violations) > 0) {
            return $this->json($violations, Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $em->persist($user);
        $em->flush();
        $security->login($user, 'json_login', 'main');

        return new JsonResponse(['user' => $this->presenter->present($user)], Response::HTTP_CREATED);
    }
}
