<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

final class ModulesTest extends ApiTestCase
{
    use ContentFixtures;

    public function testEditorsBuildTheProgramInLocalEventTime(): void
    {
        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));
        $venue = $this->save('POST', '/api/venues', ['name' => 'Grande scène', 'color' => '#14213d']);
        self::assertResponseStatusCodeSame(201);

        $slot = $this->save('POST', '/api/program_slots', [
            'title' => 'Concert d’ouverture',
            'startsAt' => '2027-07-09T20:30',
            'endsAt' => '2027-07-09T22:00',
            'venue' => '/api/venues/'.$venue['id'],
            'category' => 'Concert',
        ]);

        self::assertResponseStatusCodeSame(201);
        self::assertSame(['2027-07-09T20:30', '2027-07-09T22:00'], [$slot['startsAt'], $slot['endsAt']]);
        self::assertSame(['name' => 'Grande scène', 'color' => '#14213d'], array_intersect_key($slot['venue'], ['name' => 1, 'color' => 1]));
    }

    public function testASlotMustEndAfterItStarts(): void
    {
        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));

        $json = $this->save('POST', '/api/program_slots', ['title' => 'Inversé', 'startsAt' => '2027-07-09T22:00', 'endsAt' => '2027-07-09T20:00']);

        self::assertResponseStatusCodeSame(422);
        self::assertSame(['endsAt'], self::violationPaths($json));
    }

    public function testVisitorsReadTheProgramOfTheirLanguageButCannotChangeIt(): void
    {
        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));
        $this->save('POST', '/api/program_slots', ['title' => 'Plus tard', 'startsAt' => '2027-07-10T18:00', 'endsAt' => '2027-07-10T19:00']);
        $this->save('POST', '/api/program_slots', ['title' => 'Plus tôt', 'startsAt' => '2027-07-09T18:00', 'endsAt' => '2027-07-09T19:00']);
        $this->save('POST', '/api/program_slots', ['title' => 'Opening', 'startsAt' => '2027-07-09T18:00', 'endsAt' => '2027-07-09T19:00', 'locale' => 'en']);

        $this->client->getCookieJar()->clear();
        self::assertSame(['Plus tôt', 'Plus tard'], array_column($this->jsonRequest('GET', '/api/program_slots?locale=fr'), 'title'));

        $this->client->loginUser($this->createUser('author@example.com', ['ROLE_AUTHOR']));
        $this->save('POST', '/api/program_slots', ['title' => 'Intrus', 'startsAt' => '2027-07-09T18:00', 'endsAt' => '2027-07-09T19:00']);
        self::assertResponseStatusCodeSame(403);
    }

    public function testMapItemsArePointsOrZones(): void
    {
        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));

        $this->save('POST', '/api/map_items', ['label' => 'Infirmerie', 'kind' => 'point', 'coordinates' => [[47.39, 0.68]]]);
        self::assertResponseStatusCodeSame(201);
        $this->save('POST', '/api/map_items', ['label' => 'Camping', 'kind' => 'zone', 'coordinates' => [[47.39, 0.68], [47.40, 0.68], [47.40, 0.69]]]);
        self::assertResponseStatusCodeSame(201);

        foreach ([['point', [[47.39, 0.68], [47.40, 0.69]]], ['zone', [[47.39, 0.68], [47.40, 0.69]]], ['point', [['nord', 'est']]]] as [$kind, $coordinates]) {
            $json = $this->save('POST', '/api/map_items', ['label' => 'Faux', 'kind' => $kind, 'coordinates' => $coordinates]);
            self::assertResponseStatusCodeSame(422);
            self::assertSame(['coordinates'], self::violationPaths($json));
        }

        $this->client->getCookieJar()->clear();
        self::assertCount(2, $this->jsonRequest('GET', '/api/map_items'));
    }

    public function testTheMapBackgroundIsAMapOrAnImageOfTheMediaLibrary(): void
    {
        $default = $this->jsonRequest('GET', '/api/map-config');
        self::assertSame(['osm', 15, null], [$default['mode'], $default['zoom'], $default['background']]);

        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));
        $this->jsonRequest('PUT', '/api/map-config', ['mode' => 'image', 'centerLat' => 0, 'centerLng' => 0, 'zoom' => 2]);
        self::assertResponseStatusCodeSame(422);

        $media = $this->media();
        $json = $this->jsonRequest('PUT', '/api/map-config', ['mode' => 'image', 'centerLat' => 0, 'centerLng' => 0, 'zoom' => 2, 'backgroundMediaId' => $media->getId()]);
        self::assertResponseIsSuccessful();
        self::assertSame([800, 600], [$json['background']['width'], $json['background']['height']]);

        // The plan image cannot be deleted while it is the map background
        $this->jsonRequest('DELETE', '/api/media/'.$media->getId());
        self::assertResponseStatusCodeSame(409);

        $this->client->loginUser($this->createUser('author@example.com', ['ROLE_AUTHOR']));
        $this->jsonRequest('PUT', '/api/map-config', ['mode' => 'osm', 'centerLat' => 47, 'centerLng' => 0.7, 'zoom' => 14]);
        self::assertResponseStatusCodeSame(403);
    }

    public function testTicketOffersLinkToAnExternalTicketingService(): void
    {
        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));

        $json = $this->save('POST', '/api/ticket_offers', ['name' => 'Pass 3 jours', 'priceCents' => 11900, 'externalUrl' => 'javascript:alert(1)']);
        self::assertResponseStatusCodeSame(422);
        self::assertSame(['externalUrl'], self::violationPaths($json));

        $this->save('POST', '/api/ticket_offers', ['name' => 'Pass 3 jours', 'priceCents' => 11900, 'externalUrl' => 'https://billetterie.example.org/pass', 'position' => 1]);
        $this->save('POST', '/api/ticket_offers', ['name' => 'Billet 1 jour', 'priceCents' => 4900, 'availability' => 'sold_out', 'position' => 0]);

        $this->client->getCookieJar()->clear();
        $offers = $this->jsonRequest('GET', '/api/ticket_offers?locale=fr');
        self::assertSame(['Billet 1 jour', 'Pass 3 jours'], array_column($offers, 'name'));
        self::assertSame([4900, 'sold_out'], [$offers[0]['priceCents'], $offers[0]['availability']]);
    }

    /**
     * @param array<string, mixed> $body
     *
     * @return array<mixed>
     */
    private function save(string $method, string $uri, array $body): array
    {
        return $this->jsonRequest($method, $uri, $body, contentType: 'application/ld+json');
    }
}
