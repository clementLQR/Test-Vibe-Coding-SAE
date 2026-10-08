<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Tests\ApiTestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class MediaTest extends ApiTestCase
{
    private string $uploadDir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->uploadDir = (string) static::getContainer()->getParameter('app.media_dir');
    }

    public function testSubscribersCannotUseTheLibrary(): void
    {
        $this->client->loginUser($this->createUser('sam@example.com'));

        $this->jsonRequest('GET', '/api/media');
        self::assertResponseStatusCodeSame(403);

        $this->upload($this->jpeg(100, 100));
        self::assertResponseStatusCodeSame(403);
    }

    public function testUploadConvertsToResizedWebpWithThumbnail(): void
    {
        $this->client->loginUser($this->createUser('author@example.com', ['ROLE_AUTHOR'], 'Ana'));

        $json = $this->upload($this->jpeg(2400, 1200), ['altFr' => 'Grande scène', 'altEn' => 'Main stage']);

        self::assertResponseStatusCodeSame(201);
        self::assertSame([1600, 800, 'image/webp', 'Ana', true], [$json['width'], $json['height'], $json['mimeType'], $json['uploadedByName'], $json['altComplete']]);

        $main = $this->uploadDir.'/'.basename((string) $json['url']);
        $thumb = $this->uploadDir.'/'.basename((string) $json['thumbnailUrl']);
        self::assertFileExists($main);
        self::assertSame(400, getimagesize($thumb)[0] ?? null);

        // Deleting the media removes its files
        $this->jsonRequest('DELETE', '/api/media/'.$json['id']);
        self::assertResponseStatusCodeSame(204);
        self::assertFileDoesNotExist($main);
        self::assertFileDoesNotExist($thumb);
    }

    public function testNonImagesAreRejected(): void
    {
        $this->client->loginUser($this->createUser('author@example.com', ['ROLE_AUTHOR']));
        $path = tempnam(sys_get_temp_dir(), 'txt');
        file_put_contents($path, 'not an image');

        $json = $this->upload(new UploadedFile($path, 'notes.txt', 'text/plain', test: true));

        self::assertResponseStatusCodeSame(422);
        self::assertNotEmpty($json['violations']);
    }

    public function testOnlyTheUploaderOrAnEditorCanEditAMedia(): void
    {
        $owner = $this->createUser('owner@example.com', ['ROLE_AUTHOR']);
        $this->client->loginUser($owner);
        $id = $this->upload($this->jpeg(50, 50))['id'];

        $this->client->loginUser($this->createUser('designer@example.com', ['ROLE_DESIGNER']));
        $this->jsonRequest('PATCH', '/api/media/'.$id, ['altFr' => 'x'], contentType: 'application/merge-patch+json');
        self::assertResponseStatusCodeSame(403);

        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));
        $json = $this->jsonRequest('PATCH', '/api/media/'.$id, ['altFr' => 'Public', 'altEn' => 'Crowd'], contentType: 'application/merge-patch+json');
        self::assertResponseIsSuccessful();
        self::assertTrue($json['altComplete']);

        $this->jsonRequest('DELETE', '/api/media/'.$id);
        self::assertResponseStatusCodeSame(204);
    }

    public function testSearchMatchesNameOrAltTexts(): void
    {
        $this->client->loginUser($this->createUser('author@example.com', ['ROLE_AUTHOR']));
        $this->upload($this->jpeg(50, 50, 'stage.jpg'), ['altFr' => 'Scène', 'altEn' => 'Stage']);
        $this->upload($this->jpeg(50, 50, 'map.jpg'), ['altFr' => 'Plan du site', 'altEn' => 'Site map']);

        self::assertSame(['map.jpg'], array_column($this->jsonRequest('GET', '/api/media?q=plan'), 'originalName'));
        self::assertSame(['stage.jpg'], array_column($this->jsonRequest('GET', '/api/media?q=STAGE'), 'originalName'));
        self::assertCount(2, $this->jsonRequest('GET', '/api/media'));
    }

    /**
     * @param array<string, string> $fields
     *
     * @return array<mixed>
     */
    private function upload(UploadedFile $file, array $fields = []): array
    {
        $this->client->request('POST', '/api/media', $fields, ['file' => $file], ['HTTP_ACCEPT' => 'application/json']);

        return $this->responseJson();
    }

    /**
     * @param positive-int $width
     * @param positive-int $height
     */
    private function jpeg(int $width, int $height, string $name = 'photo.jpg'): UploadedFile
    {
        $image = imagecreatetruecolor($width, $height);
        $path = (string) tempnam(sys_get_temp_dir(), 'img');
        imagejpeg($image, $path);

        return new UploadedFile($path, $name, 'image/jpeg', test: true);
    }

    protected function tearDown(): void
    {
        // Remove files left by tests that did not delete their media
        array_map('unlink', glob($this->uploadDir.'/*.webp') ?: []);
        parent::tearDown();
    }
}
