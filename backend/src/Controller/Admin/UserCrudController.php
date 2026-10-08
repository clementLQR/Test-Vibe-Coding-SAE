<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\User;
use App\Security\Role;
use App\Security\RoleChangeGuard;
use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\EmailField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * @extends AbstractCrudController<User>
 */
final class UserCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return User::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Utilisateur')
            ->setEntityLabelInPlural('Utilisateurs')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields(['email', 'displayName']);
    }

    public function configureActions(Actions $actions): Actions
    {
        // Accounts are created by sign-up or by the installer, never here
        return $actions->disable(Action::NEW);
    }

    public function __construct(
        private readonly RoleChangeGuard $guard,
        private readonly TranslatorInterface $translator,
    ) {
    }

    /**
     * @param User $entityInstance
     */
    public function updateEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        /** @var list<string> $previousRoles */
        $previousRoles = $entityManager->getUnitOfWork()->getOriginalEntityData($entityInstance)['roles'] ?? [];
        $reason = $this->guard->refusalReason($entityInstance, $previousRoles);
        if (null !== $reason) {
            $entityInstance->setRoles($previousRoles);
            $this->addFlash('danger', $this->translator->trans($reason));
        }

        parent::updateEntity($entityManager, $entityInstance);
    }

    public function configureFields(string $pageName): iterable
    {
        yield EmailField::new('email')->setFormTypeOption('disabled', true);
        yield TextField::new('displayName', 'Nom affiché');
        yield ChoiceField::new('roles', 'Rôles')
            ->setChoices([
                'Auteur' => Role::AUTHOR,
                'Éditeur' => Role::EDITOR,
                'Designer' => Role::DESIGNER,
                'Fournisseur de données' => Role::DATA_PROVIDER,
                'Administrateur' => Role::ADMIN,
            ])
            ->allowMultipleChoices()
            ->renderExpanded()
            ->renderAsBadges();
        yield ChoiceField::new('locale', 'Langue')->setChoices(['Français' => 'fr', 'English' => 'en']);
        yield DateTimeField::new('createdAt', 'Inscription')->hideOnForm();
    }
}
