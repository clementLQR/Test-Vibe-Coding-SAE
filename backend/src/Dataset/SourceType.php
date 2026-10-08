<?php

declare(strict_types=1);

namespace App\Dataset;

enum SourceType: string
{
    /** CSV uploaded to the server (stored on disk, never in the database). */
    case File = 'file';
    /** CSV downloaded from a remote URL (e.g. an open data portal) each time it is needed. */
    case Url = 'url';
}
