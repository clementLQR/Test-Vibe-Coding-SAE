<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261008190527 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Link between the language versions of an article';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE article ADD translation_key VARCHAR(32) DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_23A0E66AADCBD56 ON article (translation_key)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP INDEX IDX_23A0E66AADCBD56 ON article');
        $this->addSql('ALTER TABLE article DROP translation_key');
    }
}
