<?php

declare(strict_types=1);

namespace App\Theme;

enum ThemeStatus: string
{
    /** Submitted by a designer, waiting for an administrator. */
    case Proposed = 'proposed';
    /** Approved and applied (one active theme per target). */
    case Active = 'active';
    case Rejected = 'rejected';
    /** Was active, replaced by another theme; can be activated again. */
    case Archived = 'archived';
}
