<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\Media;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

/**
 * Read-only overview of the media library; uploads go through the React admin.
 *
 * @extends AbstractCrudController<Media>
 */
final class MediaCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Media::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Média')
            ->setEntityLabelInPlural('Médias')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields(['originalName', 'altFr', 'altEn']);
    }

    public function configureActions(Actions $actions): Actions
    {
        return $actions->disable(Action::NEW, Action::EDIT);
    }

    public function configureFields(string $pageName): iterable
    {
        yield ImageField::new('thumbnailUrl', 'Aperçu')->onlyOnIndex();
        yield TextField::new('originalName', 'Fichier');
        yield TextField::new('altFr', 'Alt (FR)');
        yield TextField::new('altEn', 'Alt (EN)');
        yield IntegerField::new('size', 'Poids (octets)');
        yield DateTimeField::new('createdAt', 'Ajouté le');
    }
}
