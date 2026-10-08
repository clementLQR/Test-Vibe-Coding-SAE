<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

final class DemoTest extends ApiTestCase
{
    protected function tearDown(): void
    {
        $dir = (string) static::getContainer()->getParameter('app.dataset_dir');
        array_map('unlink', glob($dir.'/*.csv') ?: []);
        parent::tearDown();
    }

    public function testTheInstallerCanFillTheSiteWithTheDemoEvent(): void
    {
        $this->jsonRequest('POST', '/api/install', [
            'siteName' => 'Festival démo',
            'eventStart' => '2027-07-09',
            'eventEnd' => '2027-07-11',
            'adminEmail' => 'admin@example.com',
            'adminPassword' => 'a-long-password',
            'adminDisplayName' => 'Admin',
            'demo' => true,
        ]);
        self::assertResponseStatusCodeSame(201);

        $this->client->getCookieJar()->clear();
        $articles = $this->jsonRequest('GET', '/api/articles?locale=fr');
        self::assertCount(5, $articles);

        // Every demo chart renders from its data set
        $review = $this->jsonRequest('GET', '/api/articles/by-slug/bilan-de-l-affluence');
        self::assertSame('en', $review['translations'][0]['locale']);
        $datasetId = $review['blocks'][2]['visualization']['datasetId'];
        $data = $this->jsonRequest('GET', "/api/datasets/$datasetId/data");
        self::assertCount(60, $data['rows']);

        $program = $this->jsonRequest('GET', '/api/program_slots?locale=fr');
        self::assertSame(['2027-07-09T18:00', '2027-07-10T00:30'], [$program[0]['startsAt'], $program[2]['endsAt']]);
        self::assertCount(5, $this->jsonRequest('GET', '/api/map_items'));
        self::assertCount(4, $this->jsonRequest('GET', '/api/ticket_offers'));
        self::assertSame([['title' => 'Infos pratiques', 'slug' => 'infos-pratiques']], $this->jsonRequest('GET', '/api/menu'));
    }
}
