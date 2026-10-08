<?php

declare(strict_types=1);

namespace App\Tests;

use App\Entity\SiteSettings;
use App\Entity\User;
use Doctrine\Common\DataFixtures\Purger\ORMPurger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Base class for functional API tests: empty database before each test,
 * helpers to create users and send JSON requests.
 */
abstract class ApiTestCase extends WebTestCase
{
    protected const PASSWORD = 'test-password-123';

    protected KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        (new ORMPurger($this->em()))->purge();
    }

    protected function em(): EntityManagerInterface
    {
        return static::getContainer()->get(EntityManagerInterface::class);
    }

    protected function install(): SiteSettings
    {
        $settings = (new SiteSettings())->setSiteName('Test festival');
        $this->em()->persist($settings);
        $this->em()->flush();

        return $settings;
    }

    /**
     * @param list<string> $roles
     */
    protected function createUser(string $email, array $roles = [], string $displayName = 'Test user'): User
    {
        $user = (new User())->setEmail($email)->setDisplayName($displayName)->setRoles($roles);
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $user->setPassword($hasher->hashPassword($user, self::PASSWORD));
        $this->em()->persist($user);
        $this->em()->flush();

        return $user;
    }

    /**
     * @param array<string, mixed>|null $body
     * @param array<string, string>     $headers extra HTTP headers, e.g. ['HTTP_ACCEPT_LANGUAGE' => 'en']
     *
     * @return array<mixed>
     */
    protected function jsonRequest(string $method, string $uri, ?array $body = null, array $headers = [], string $contentType = 'application/json'): array
    {
        $this->client->request(
            $method,
            $uri,
            server: ['CONTENT_TYPE' => $contentType, 'HTTP_ACCEPT' => 'application/json', ...$headers],
            content: null === $body ? null : json_encode($body, \JSON_THROW_ON_ERROR),
        );

        return $this->responseJson();
    }

    /**
     * @return array<mixed>
     */
    protected function responseJson(): array
    {
        $content = (string) $this->client->getResponse()->getContent();

        return '' === $content ? [] : (array) json_decode($content, true, flags: \JSON_THROW_ON_ERROR);
    }

    /**
     * @param array<mixed> $json
     *
     * @return list<string>
     */
    protected static function violationPaths(array $json): array
    {
        /** @var list<array{propertyPath: string}> $violations */
        $violations = $json['violations'] ?? [];

        return array_column($violations, 'propertyPath');
    }
}
