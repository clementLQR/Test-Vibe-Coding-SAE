<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

final class UserAdminTest extends ApiTestCase
{
    public function testOnlyAdminsCanListUsers(): void
    {
        $this->jsonRequest('GET', '/api/users');
        self::assertResponseStatusCodeSame(401);

        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));
        $this->jsonRequest('GET', '/api/users');
        self::assertResponseStatusCodeSame(403);

        $this->client->loginUser($this->createUser('admin@example.com', ['ROLE_ADMIN']));
        $json = $this->jsonRequest('GET', '/api/users');
        self::assertResponseIsSuccessful();
        self::assertCount(2, $json);
        self::assertArrayNotHasKey('password', $json[0]);
    }

    public function testAdminChangesTheRolesOfAnotherUser(): void
    {
        $this->client->loginUser($this->createUser('admin@example.com', ['ROLE_ADMIN']));
        $sam = $this->createUser('sam@example.com');

        $json = $this->jsonRequest('PATCH', '/api/users/'.$sam->getId(), ['roles' => ['ROLE_AUTHOR', 'ROLE_DATA_PROVIDER']], contentType: 'application/merge-patch+json');

        self::assertResponseIsSuccessful();
        self::assertEqualsCanonicalizing(['ROLE_AUTHOR', 'ROLE_DATA_PROVIDER', 'ROLE_SUBSCRIBER'], $json['roles']);
    }

    public function testUnknownRolesAreRejected(): void
    {
        $this->client->loginUser($this->createUser('admin@example.com', ['ROLE_ADMIN']));
        $sam = $this->createUser('sam@example.com');

        $this->jsonRequest('PATCH', '/api/users/'.$sam->getId(), ['roles' => ['ROLE_SUPERHERO']], contentType: 'application/merge-patch+json');

        self::assertResponseStatusCodeSame(422);
    }

    public function testAnAdminCannotDemoteThemselves(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $this->createUser('other-admin@example.com', ['ROLE_ADMIN']);
        $this->client->loginUser($admin);

        $json = $this->jsonRequest('PATCH', '/api/users/'.$admin->getId(), ['roles' => ['ROLE_EDITOR']], ['HTTP_ACCEPT_LANGUAGE' => 'fr'], 'application/merge-patch+json');

        self::assertResponseStatusCodeSame(422);
        self::assertStringContainsString('propre rôle', (string) $json['detail']);
    }

    public function testAnotherAdminCanBeDemotedWhileOneRemains(): void
    {
        $this->client->loginUser($this->createUser('admin@example.com', ['ROLE_ADMIN']));
        $other = $this->createUser('other-admin@example.com', ['ROLE_ADMIN']);

        $json = $this->jsonRequest('PATCH', '/api/users/'.$other->getId(), ['roles' => []], contentType: 'application/merge-patch+json');

        self::assertResponseIsSuccessful();
        self::assertSame(['ROLE_SUBSCRIBER'], $json['roles']);
    }
}
