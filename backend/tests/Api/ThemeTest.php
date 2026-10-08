<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\User;
use App\Tests\ApiTestCase;

final class ThemeTest extends ApiTestCase
{
    private const TOKENS = ['headerBg' => '#14213d', 'headerFg' => '#ffffff', 'titleSize' => 2.5, 'fontHeading' => 'serif', 'chartPalette' => ['#fca311', '#14213d']];

    private User $designer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->designer = $this->createUser('designer@example.com', ['ROLE_DESIGNER'], 'Dina');
    }

    public function testADesignerProposesAThemeThatAnAdminApproves(): void
    {
        $this->client->loginUser($this->designer);
        $theme = $this->save('POST', '/api/themes', ['name' => 'Nuit d’été', 'scope' => 'site', 'tokens' => self::TOKENS]);
        self::assertResponseStatusCodeSame(201);
        self::assertSame(['proposed', 'Dina'], [$theme['status'], $theme['proposedByName']]);

        $this->client->getCookieJar()->clear();
        self::assertSame([], $this->jsonRequest('GET', '/api/active-themes'), 'not applied before approval');

        $this->client->loginUser($this->designer);
        $this->jsonRequest('POST', '/api/themes/'.$theme['id'].'/approve');
        self::assertResponseStatusCodeSame(403);

        $this->client->loginUser($this->createUser('admin@example.com', ['ROLE_ADMIN']));
        self::assertSame('active', $this->jsonRequest('POST', '/api/themes/'.$theme['id'].'/approve')['status']);

        $this->client->getCookieJar()->clear();
        $active = $this->jsonRequest('GET', '/api/active-themes');
        self::assertSame('site', $active[0]['scope']);
        self::assertEquals(self::TOKENS, $active[0]['tokens']);
    }

    public function testApprovingAThemeArchivesTheOneItReplaces(): void
    {
        $this->client->loginUser($this->designer);
        $first = $this->save('POST', '/api/themes', ['name' => 'Jour', 'scope' => 'site', 'tokens' => ['pageBg' => '#ffffff']]);
        $second = $this->save('POST', '/api/themes', ['name' => 'Nuit', 'scope' => 'site', 'tokens' => ['pageBg' => '#000000']]);

        $this->client->loginUser($this->createUser('admin@example.com', ['ROLE_ADMIN']));
        $this->jsonRequest('POST', '/api/themes/'.$first['id'].'/approve');
        $this->jsonRequest('POST', '/api/themes/'.$second['id'].'/approve');

        $statuses = array_column($this->jsonRequest('GET', '/api/themes'), 'status', 'name');
        self::assertSame(['Jour' => 'archived', 'Nuit' => 'active'], [...$statuses]);
    }

    public function testRejectedThemesGoBackToReviewWhenTheDesignerEditsThem(): void
    {
        $this->client->loginUser($this->designer);
        $theme = $this->save('POST', '/api/themes', ['name' => 'Fluo', 'scope' => 'site', 'tokens' => ['accent' => '#39ff14']]);

        $this->client->loginUser($this->createUser('admin@example.com', ['ROLE_ADMIN']));
        $rejected = $this->jsonRequest('POST', '/api/themes/'.$theme['id'].'/reject', ['comment' => 'Contraste insuffisant sur fond blanc.']);
        self::assertSame(['rejected', 'Contraste insuffisant sur fond blanc.'], [$rejected['status'], $rejected['reviewComment']]);

        $this->client->loginUser($this->designer);
        $edited = $this->jsonRequest('PATCH', '/api/themes/'.$theme['id'], ['tokens' => ['accent' => '#1b5e20']], contentType: 'application/merge-patch+json');
        self::assertSame(['proposed', null], [$edited['status'], $edited['reviewComment']]);
    }

    public function testDesignersCannotEditOthersOrLiveThemes(): void
    {
        $this->client->loginUser($this->designer);
        $theme = $this->save('POST', '/api/themes', ['name' => 'Sobre', 'scope' => 'site', 'tokens' => []]);

        $this->client->loginUser($this->createUser('other@example.com', ['ROLE_DESIGNER']));
        $this->jsonRequest('PATCH', '/api/themes/'.$theme['id'], ['name' => 'Volé'], contentType: 'application/merge-patch+json');
        self::assertResponseStatusCodeSame(403);

        $this->client->loginUser($this->createUser('admin@example.com', ['ROLE_ADMIN']));
        $this->jsonRequest('POST', '/api/themes/'.$theme['id'].'/approve');
        $this->client->loginUser($this->designer);
        $this->jsonRequest('PATCH', '/api/themes/'.$theme['id'], ['name' => 'Modifié en ligne'], contentType: 'application/merge-patch+json');
        self::assertResponseStatusCodeSame(403);
    }

    public function testTokensAndTargetsAreValidated(): void
    {
        $this->client->loginUser($this->designer);

        $json = $this->save('POST', '/api/themes', [
            'name' => 'Piège',
            'scope' => 'article',
            'tokens' => ['pageBg' => 'red; background:url(evil)', 'titleSize' => 12, 'fontBody' => 'Comic Sans', 'customCss' => 'body{}'],
        ]);

        self::assertResponseStatusCodeSame(422);
        self::assertEqualsCanonicalizing(
            ['tokens[pageBg]', 'tokens[titleSize]', 'tokens[fontBody]', 'tokens[customCss]', 'article'],
            self::violationPaths($json),
        );
    }

    public function testSubscribersAndAuthorsCannotProposeThemes(): void
    {
        $this->client->loginUser($this->createUser('author@example.com', ['ROLE_AUTHOR']));

        $this->save('POST', '/api/themes', ['name' => 'Auteur', 'scope' => 'site', 'tokens' => []]);

        self::assertResponseStatusCodeSame(403);
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
