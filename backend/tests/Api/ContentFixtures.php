<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Dataset\SourceType;
use App\Dataset\VariableType;
use App\Entity\Dataset;
use App\Entity\DatasetVariable;
use App\Entity\Media;
use App\Entity\User;
use App\Entity\Visualization;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Builds content directly in the database for article and chart tests.
 */
trait ContentFixtures
{
    abstract protected function em(): EntityManagerInterface;

    protected function validatedDataset(?User $provider = null, bool $validated = true): Dataset
    {
        $dataset = (new Dataset(SourceType::File, 'none.csv', $provider))->setName('Affluence');
        new DatasetVariable($dataset, 0, 'Scène', VariableType::Categorical);
        new DatasetVariable($dataset, 1, 'Jour', VariableType::Categorical);
        new DatasetVariable($dataset, 2, 'Spectateurs', VariableType::Numerical);
        new DatasetVariable($dataset, 3, 'Heure', VariableType::Numerical);
        if ($validated) {
            $dataset->markValidated();
        }
        $this->em()->persist($dataset);
        $this->em()->flush();

        return $dataset;
    }

    protected function visualization(?User $creator, ?Dataset $dataset = null): Visualization
    {
        $visualization = (new Visualization())
            ->setTitle('Spectateurs par scène')
            ->setDescription('La grande scène attire le plus de monde.')
            ->setChartType('bar')
            ->setDataset($dataset ?? $this->validatedDataset())
            ->setMapping(['x' => 'Scène', 'y' => 'Spectateurs'])
            ->setCreatedBy($creator);
        $this->em()->persist($visualization);
        $this->em()->flush();

        return $visualization;
    }

    protected function media(bool $withAlt = true): Media
    {
        $media = new Media(bin2hex(random_bytes(8)), 'scene.jpg', 1000, 800, 600, null);
        if ($withAlt) {
            $media->setAltFr('La scène')->setAltEn('The stage');
        }
        $this->em()->persist($media);
        $this->em()->flush();

        return $media;
    }
}
