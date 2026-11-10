#!/usr/bin/env bash
# A copy of the database (every night) and optionally of the uploaded files (weekly).
#
#   ./backup.sh           database only
#   ./backup.sh --media   database and the media files
#
# Copies are kept in deploy/backups for 14 days. When BACKUP_S3_URI is set in .env they are also uploaded there, which
# is what protects you if the server itself is lost. Run it from cron; see docs/deploying-aws.md.
set -euo pipefail
cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p backups

dump="backups/ricochet-$stamp.dump"
docker compose exec -T postgres pg_dump -U ricochet -Fc ricochet > "$dump"
# An empty or tiny dump means pg_dump failed quietly. Better to notice now than when restoring.
if [ "$(wc -c < "$dump")" -lt 1000 ]; then
  echo "Backup looks empty: $dump" >&2
  rm -f "$dump"
  exit 1
fi
echo "Wrote $dump"
uploads=("$dump")

if [ "${1:-}" = "--media" ]; then
  media="backups/media-$stamp.tar.gz"
  docker run --rm -v ricochet_media:/media:ro alpine tar -czf - -C /media . > "$media"
  echo "Wrote $media"
  uploads+=("$media")
fi

if [ -n "${BACKUP_S3_URI:-}" ]; then
  for file in "${uploads[@]}"; do
    aws s3 cp "$file" "${BACKUP_S3_URI%/}/$(basename "$file")"
  done
fi

find backups -type f \( -name 'ricochet-*.dump' -o -name 'media-*.tar.gz' \) -mtime +14 -delete
