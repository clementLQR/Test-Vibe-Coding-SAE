<?php

declare(strict_types=1);

namespace App\Security;

/**
 * Application roles. The hierarchy itself lives in config/packages/security.yaml.
 *
 * Every authenticated user is at least a subscriber; visitors are anonymous.
 */
final class Role
{
    public const SUBSCRIBER = 'ROLE_SUBSCRIBER';
    public const AUTHOR = 'ROLE_AUTHOR';
    public const EDITOR = 'ROLE_EDITOR';
    public const DESIGNER = 'ROLE_DESIGNER';
    public const DATA_PROVIDER = 'ROLE_DATA_PROVIDER';
    public const ADMIN = 'ROLE_ADMIN';

    /** Roles an administrator can grant (subscriber is implicit). */
    public const ASSIGNABLE = [self::AUTHOR, self::EDITOR, self::DESIGNER, self::DATA_PROVIDER, self::ADMIN];

    private function __construct()
    {
    }
}
