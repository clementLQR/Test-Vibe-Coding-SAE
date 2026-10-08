<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261008163823 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Users, site settings and media library';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE media (id INT AUTO_INCREMENT NOT NULL, storage_key VARCHAR(64) NOT NULL, original_name VARCHAR(255) NOT NULL, mime_type VARCHAR(50) NOT NULL, size INT NOT NULL, width INT NOT NULL, height INT NOT NULL, alt_fr VARCHAR(255) NOT NULL, alt_en VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL, uploaded_by_id INT DEFAULT NULL, UNIQUE INDEX UNIQ_6A2CA10C111795A5 (storage_key), INDEX IDX_6A2CA10CA2B28FE8 (uploaded_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE site_settings (id INT AUTO_INCREMENT NOT NULL, site_name VARCHAR(120) NOT NULL, tagline VARCHAR(255) DEFAULT NULL, event_start DATE DEFAULT NULL, event_end DATE DEFAULT NULL, location VARCHAR(255) DEFAULT NULL, default_locale VARCHAR(2) NOT NULL, installed_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE `user` (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, display_name VARCHAR(80) NOT NULL, locale VARCHAR(2) NOT NULL, created_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_8D93D649E7927C74 (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE media ADD CONSTRAINT FK_6A2CA10CA2B28FE8 FOREIGN KEY (uploaded_by_id) REFERENCES `user` (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE media DROP FOREIGN KEY FK_6A2CA10CA2B28FE8');
        $this->addSql('DROP TABLE media');
        $this->addSql('DROP TABLE site_settings');
        $this->addSql('DROP TABLE `user`');
    }
}
