<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

final class InstallTest extends ApiTestCase
{
    private const VALID_PAYLOAD = [
        'locale' => 'en',
        'siteName' => 'Summer festival',
        'eventStart' => '2027-07-10',
        'eventEnd' => '2027-07-12',
        'location' => 'Tours',
        'adminEmail' => 'Admin@Example.com',
        'adminPassword' => 'a-long-password',
        'adminDisplayName' => 'Alex',
    ];

    public function testStatusIsFalseBeforeInstallation(): void
    {
        self::assertSame(['installed' => false], $this->jsonRequest('GET', '/api/install/status'));
        $this->jsonRequest('GET', '/api/settings');
        self::assertResponseStatusCodeSame(404);
    }

    public function testInstallationCreatesSettingsAndLogsTheAdminIn(): void
    {
        $json = $this->jsonRequest('POST', '/api/install', self::VALID_PAYLOAD);

        self::assertResponseStatusCodeSame(201);
        self::assertSame('admin@example.com', $json['user']['email']);
        self::assertContains('ROLE_ADMIN', $json['user']['roles']);
        self::assertContains('ROLE_AUTHOR', $json['user']['roles'], 'hierarchy is expanded');

        self::assertSame('admin@example.com', $this->jsonRequest('GET', '/api/me')['user']['email']);
        self::assertSame(['installed' => true], $this->jsonRequest('GET', '/api/install/status'));
        self::assertSame([
            'siteName' => 'Summer festival',
            'tagline' => null,
            'eventStart' => '2027-07-10',
            'eventEnd' => '2027-07-12',
            'location' => 'Tours',
            'defaultLocale' => 'en',
        ], $this->jsonRequest('GET', '/api/settings'));
    }

    public function testInstallationCanOnlyHappenOnce(): void
    {
        $this->install();

        $this->jsonRequest('POST', '/api/install', self::VALID_PAYLOAD);

        self::assertResponseStatusCodeSame(409);
    }

    public function testInvalidPayloadIsRejectedWithFieldErrors(): void
    {
        $json = $this->jsonRequest('POST', '/api/install', [
            ...self::VALID_PAYLOAD,
            'siteName' => '',
            'adminEmail' => 'not-an-email',
            'adminPassword' => 'short',
        ]);

        self::assertResponseStatusCodeSame(422);
        self::assertEqualsCanonicalizing(['siteName', 'adminEmail', 'adminPassword'], self::violationPaths($json));
    }

    public function testEventEndBeforeStartIsRejected(): void
    {
        $json = $this->jsonRequest('POST', '/api/install', [...self::VALID_PAYLOAD, 'eventEnd' => '2027-07-01']);

        self::assertResponseStatusCodeSame(422);
        self::assertSame(['eventEnd'], self::violationPaths($json));
    }
}
