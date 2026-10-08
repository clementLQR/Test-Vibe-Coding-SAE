<?php

declare(strict_types=1);

namespace App\Article;

enum ArticleStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    /** Was published, taken offline without being deleted. */
    case Hidden = 'hidden';
}
