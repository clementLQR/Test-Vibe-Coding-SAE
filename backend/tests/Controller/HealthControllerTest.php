<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class HealthControllerTest extends WebTestCase
{
    public function testHealthReturnsStatusAndVersion(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/health');

        self::assertResponseIsSuccessful();
        self::assertJsonStringEqualsJsonString(
            json_encode(['status' => 'ok', 'version' => '0.1.0'], \JSON_THROW_ON_ERROR),
            (string) $client->getResponse()->getContent(),
        );
    }
}
