<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Dto\InstallRequest;
use App\Entity\SiteSettings;
use App\Entity\User;
use App\Repository\SiteSettingsRepository;
use App\Security\Role;
use App\Security\UserPresenter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * WordPress-like installation wizard. Usable only once: as soon as the site
 * settings exist, every installation request is refused.
 */
#[Route('/api/install')]
final class InstallController extends AbstractController
{
    public function __construct(private readonly SiteSettingsRepository $settings)
    {
    }

    #[Route('/status', name: 'api_install_status', methods: ['GET'])]
    public function status(): JsonResponse
    {
        return new JsonResponse(['installed' => null !== $this->settings->findCurrent()]);
    }

    #[Route('', name: 'api_install', methods: ['POST'])]
    public function install(
        #[MapRequestPayload] InstallRequest $payload,
        UserPasswordHasherInterface $hasher,
        ValidatorInterface $validator,
        EntityManagerInterface $em,
        Security $security,
        UserPresenter $presenter,
        TranslatorInterface $translator,
    ): JsonResponse {
        if (null !== $this->settings->findCurrent()) {
            return new JsonResponse(['message' => $translator->trans('install.already_done')], Response::HTTP_CONFLICT);
        }

        $settings = (new SiteSettings())
            ->setSiteName($payload->siteName)
            ->setTagline($payload->tagline ?: null)
            ->setLocation($payload->location ?: null)
            ->setEventStart($payload->eventStart ? new \DateTimeImmutable($payload->eventStart) : null)
            ->setEventEnd($payload->eventEnd ? new \DateTimeImmutable($payload->eventEnd) : null)
            ->setDefaultLocale($payload->locale);

        $admin = (new User())
            ->setEmail($payload->adminEmail)
            ->setDisplayName($payload->adminDisplayName)
            ->setLocale($payload->locale)
            ->setRoles([Role::ADMIN]);
        $admin->setPassword($hasher->hashPassword($admin, $payload->adminPassword));

        $violations = new ConstraintViolationList();
        $violations->addAll($validator->validate($settings));
        $violations->addAll($validator->validate($admin));
        if (\count($violations) > 0) {
            return $this->json($violations, Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $em->wrapInTransaction(static function (EntityManagerInterface $em) use ($settings, $admin): void {
            $em->persist($settings);
            $em->persist($admin);
        });
        $security->login($admin, 'json_login', 'main');

        return new JsonResponse(['user' => $presenter->present($admin)], Response::HTTP_CREATED);
    }
}
