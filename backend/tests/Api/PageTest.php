<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

final class PageTest extends ApiTestCase
{
    use ContentFixtures;

    public function testEditorsBuildPagesWithBlocksAndCharts(): void
    {
        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));
        $chart = $this->visualization(null);

        $json = $this->save('POST', '/api/pages', [
            'title' => 'Infos pratiques',
            'template' => 'contact',
            'status' => 'published',
            'menuOrder' => 2,
            'blocks' => [
                ['type' => 'heading', 'text' => 'Accès'],
                ['type' => 'visualization', 'visualizationId' => $chart->getId()],
            ],
        ]);

        self::assertResponseStatusCodeSame(201);
        self::assertSame(['infos-pratiques', 'contact', 'published', true, 2], [$json['slug'], $json['template'], $json['status'], $json['showInMenu'], $json['menuOrder']]);
        self::assertSame(['heading', 'visualization'], array_column($json['blocks'], 'type'));
    }

    public function testAuthorsCannotManagePages(): void
    {
        $this->client->loginUser($this->createUser('author@example.com', ['ROLE_AUTHOR']));

        $this->save('POST', '/api/pages', ['title' => 'Infos']);

        self::assertResponseStatusCodeSame(403);
    }

    public function testVisitorsSeePublishedPagesAndTheMenuOfTheirLanguage(): void
    {
        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));
        $this->save('POST', '/api/pages', ['title' => 'Contact', 'status' => 'published', 'menuOrder' => 2]);
        $this->save('POST', '/api/pages', ['title' => 'Accès', 'status' => 'published', 'menuOrder' => 1]);
        $this->save('POST', '/api/pages', ['title' => 'Hors menu', 'status' => 'published', 'showInMenu' => false]);
        $this->save('POST', '/api/pages', ['title' => 'Brouillon']);
        $this->save('POST', '/api/pages', ['title' => 'Getting there', 'status' => 'published', 'locale' => 'en']);

        $this->client->getCookieJar()->clear();
        self::assertSame(
            [['title' => 'Accès', 'slug' => 'acces'], ['title' => 'Contact', 'slug' => 'contact']],
            $this->jsonRequest('GET', '/api/menu?locale=fr'),
        );
        self::assertSame('Getting there', $this->jsonRequest('GET', '/api/menu?locale=en')[0]['title']);
        self::assertSame('Hors menu', $this->jsonRequest('GET', '/api/pages/by-slug/hors-menu')['title']);
        self::assertCount(4, $this->jsonRequest('GET', '/api/pages'));

        $this->jsonRequest('GET', '/api/pages/by-slug/brouillon');
        self::assertResponseStatusCodeSame(401);
        $this->jsonRequest('GET', '/api/pages/by-slug/inconnue');
        self::assertResponseStatusCodeSame(404);
    }

    public function testPublishedArticlesAreReadableBySlug(): void
    {
        $this->client->loginUser($this->createUser('author@example.com', ['ROLE_AUTHOR']));
        $this->save('POST', '/api/articles', ['title' => 'Bilan', 'status' => 'published', 'blocks' => [['type' => 'text', 'text' => 'Merci !']]]);

        $this->client->getCookieJar()->clear();
        $json = $this->jsonRequest('GET', '/api/articles/by-slug/bilan');

        self::assertResponseIsSuccessful();
        self::assertSame(['Bilan', 'Merci !'], [$json['title'], $json['blocks'][0]['text']]);
    }

    public function testAnImageUsedInAPageCannotBeDeleted(): void
    {
        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));
        $media = $this->media();
        $this->save('POST', '/api/pages', ['title' => 'Plan', 'blocks' => [['type' => 'image', 'mediaId' => $media->getId()]]]);

        $json = $this->jsonRequest('DELETE', '/api/media/'.$media->getId(), headers: ['HTTP_ACCEPT_LANGUAGE' => 'fr']);

        self::assertResponseStatusCodeSame(409);
        self::assertStringContainsString('Plan', (string) $json['detail']);
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
