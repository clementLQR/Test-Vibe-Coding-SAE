<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

final class AuthTest extends ApiTestCase
{
    public function testRegistrationIsRefusedBeforeInstallation(): void
    {
        $this->jsonRequest('POST', '/api/register', ['email' => 'a@b.fr', 'password' => 'long-password', 'displayName' => 'Ab']);

        self::assertResponseStatusCodeSame(409);
    }

    public function testRegistrationCreatesALoggedInSubscriber(): void
    {
        $this->install();

        $json = $this->jsonRequest('POST', '/api/register', [
            'email' => 'sam@example.com',
            'password' => 'long-password',
            'displayName' => 'Sam',
            'locale' => 'en',
        ]);

        self::assertResponseStatusCodeSame(201);
        self::assertSame(['ROLE_SUBSCRIBER'], $json['user']['roles']);
        self::assertSame('sam@example.com', $this->jsonRequest('GET', '/api/me')['user']['email']);
    }

    public function testRegistrationRejectsATakenEmail(): void
    {
        $this->install();
        $this->createUser('sam@example.com');

        $json = $this->jsonRequest('POST', '/api/register', ['email' => 'SAM@example.com', 'password' => 'long-password', 'displayName' => 'Sam']);

        self::assertResponseStatusCodeSame(422);
        self::assertSame(['email'], self::violationPaths($json));
    }

    public function testLoginMeAndLogout(): void
    {
        $this->createUser('sam@example.com', displayName: 'Sam');

        $json = $this->jsonRequest('POST', '/api/login', ['email' => 'sam@example.com', 'password' => self::PASSWORD]);
        self::assertResponseIsSuccessful();
        self::assertSame('Sam', $json['user']['displayName']);

        $this->jsonRequest('POST', '/api/logout');
        self::assertResponseStatusCodeSame(204);
        self::assertSame(['user' => null], $this->jsonRequest('GET', '/api/me'));
    }

    public function testWrongPasswordIsRejectedInTheRequestedLanguage(): void
    {
        $this->createUser('sam@example.com');

        $json = $this->jsonRequest('POST', '/api/login', ['email' => 'sam@example.com', 'password' => 'wrong'], ['HTTP_ACCEPT_LANGUAGE' => 'en']);
        self::assertResponseStatusCodeSame(401);
        self::assertSame('Incorrect email or password.', $json['message']);

        $json = $this->jsonRequest('POST', '/api/login', ['email' => 'sam@example.com', 'password' => 'wrong'], ['HTTP_ACCEPT_LANGUAGE' => 'fr-FR,fr;q=0.9']);
        self::assertSame('E-mail ou mot de passe incorrect.', $json['message']);
    }

    public function testCrossOriginWriteRequestsAreRefused(): void
    {
        $this->createUser('sam@example.com');

        $this->jsonRequest('POST', '/api/login', ['email' => 'sam@example.com', 'password' => self::PASSWORD], ['HTTP_ORIGIN' => 'https://evil.example']);
        self::assertResponseStatusCodeSame(403);

        $this->jsonRequest('POST', '/api/login', ['email' => 'sam@example.com', 'password' => self::PASSWORD], ['HTTP_SEC_FETCH_SITE' => 'cross-site']);
        self::assertResponseStatusCodeSame(403);

        $this->jsonRequest('POST', '/api/login', ['email' => 'sam@example.com', 'password' => self::PASSWORD], ['HTTP_ORIGIN' => 'http://localhost', 'HTTP_SEC_FETCH_SITE' => 'same-origin']);
        self::assertResponseIsSuccessful();
    }

    public function testBackOfficeRedirectsVisitorsToTheLoginPageAndRefusesNonAdmins(): void
    {
        $this->client->request('GET', '/admin');
        self::assertResponseRedirects('/login?redirect=%2Fadmin');

        $this->client->loginUser($this->createUser('author@example.com', ['ROLE_AUTHOR']));
        $this->client->request('GET', '/admin');
        self::assertResponseStatusCodeSame(403);

        $this->client->loginUser($this->createUser('admin@example.com', ['ROLE_ADMIN']));
        $this->client->request('GET', '/admin');
        self::assertResponseRedirects();
        $this->client->followRedirect();
        self::assertResponseIsSuccessful();
    }
}
