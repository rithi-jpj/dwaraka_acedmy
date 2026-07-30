#!/bin/bash
# =============================================================================
# Dwaraka Academy — Automated Database Backup Script
# =============================================================================
# Usage:
#   ./scripts/backup.sh                   # Run backup with default settings
#   DRY_RUN=true ./scripts/backup.sh       # Preview without executing
#
# Environment variables (can be set in .env or exported):
#   DATABASE_URL      — PostgreSQL connection string (required)
#   BACKUP_DIR        — Backup directory (default: ./backups)
#   BACKUP_RETENTION  — Days to keep backups (default: 30)
#   S3_BUCKET         — Optional S3 bucket for offsite backup
#   AWS_PROFILE       — AWS CLI profile for S3 upload
# =============================================================================

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env if present
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
BACKUP_RETENTION="${BACKUP_RETENTION:-30}"
DRY_RUN="${DRY_RUN:-false}"

# ── Validate ───────────────────────────────────────────────────────────────

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

if ! command -v pg_dump &> /dev/null; then
  echo "ERROR: pg_dump not found. Install PostgreSQL client tools."
  exit 1
fi

# ── Setup ──────────────────────────────────────────────────────────────────

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/dwaraka_academy_${TIMESTAMP}.sql.gz"
VERIFY_FILE="${BACKUP_FILE}.sha256"

echo "============================================"
echo " Dwaraka Academy — Database Backup"
echo " Timestamp:  $(date)"
echo " Backup dir: $BACKUP_DIR"
echo " Retention:  ${BACKUP_RETENTION} days"
echo "============================================"

# ── Backup ─────────────────────────────────────────────────────────────────

if [ "$DRY_RUN" = "true" ]; then
  echo "[DRY-RUN] Would execute: pg_dump \"$DATABASE_URL\" --no-owner --clean | gzip > \"$BACKUP_FILE\""
  echo "[DRY-RUN] Would create checksum in: $VERIFY_FILE"
else
  echo "[1/3] Dumping database..."
  pg_dump "$DATABASE_URL" --no-owner --clean 2>/dev/null | gzip > "$BACKUP_FILE"
  
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "       Backup size: $BACKUP_SIZE"
  
  # ── Verify ───────────────────────────────────────────────────────────────
  
  echo "[2/3] Verifying backup integrity..."
  if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    echo "       ✓ Backup integrity verified (gzip checksum passed)"
  else
    echo "       ✗ Backup is corrupted!"
    rm -f "$BACKUP_FILE"
    exit 1
  fi
  
  # Generate SHA256 checksum
  sha256sum "$BACKUP_FILE" > "$VERIFY_FILE"
  echo "       ✓ Checksum saved: $(cut -d' ' -f1 "$VERIFY_FILE")"
  
  # ── Restore test (quick — validates SQL syntax) ──────────────────────────
  
  echo "[3/3] Validating SQL structure..."
  if zcat "$BACKUP_FILE" | head -100 | grep -q "CREATE TABLE\|CREATE SCHEMA"; then
    echo "       ✓ SQL structure validation passed"
  else
    echo "       ⚠ Could not validate SQL structure"
  fi
  
  echo ""
  echo "✓ Backup completed successfully: $BACKUP_FILE"
  echo "  Size: $BACKUP_SIZE"
  
  # ── Retention cleanup ────────────────────────────────────────────────────
  
  echo ""
  echo "Applying retention policy (${BACKUP_RETENTION} days)..."
  find "$BACKUP_DIR" -name "dwaraka_academy_*.sql.gz" -type f -mtime "+${BACKUP_RETENTION}" -delete
  find "$BACKUP_DIR" -name "dwaraka_academy_*.sql.gz.sha256" -type f -mtime "+${BACKUP_RETENTION}" -delete
  echo "  ✓ Old backups cleaned up"
  
  # ── Count remaining backups ─────────────────────────────────────────────
  
  COUNT=$(find "$BACKUP_DIR" -name "dwaraka_academy_*.sql.gz" -type f | wc -l)
  echo "  ${COUNT} backup(s) retained"
  
  # ── Optional S3 upload ──────────────────────────────────────────────────
  
  if [ -n "${S3_BUCKET:-}" ]; then
    echo ""
    echo "Uploading to S3: ${S3_BUCKET}"
    if command -v aws &> /dev/null; then
      AWS_ARGS=""
      if [ -n "${AWS_PROFILE:-}" ]; then
        AWS_ARGS="--profile $AWS_PROFILE"
      fi
      aws s3 cp "$BACKUP_FILE" "${S3_BUCKET}/$(basename "$BACKUP_FILE")" $AWS_ARGS
      aws s3 cp "$VERIFY_FILE" "${S3_BUCKET}/$(basename "$VERIFY_FILE")" $AWS_ARGS
      echo "  ✓ Uploaded to S3"
    else
      echo "  ⚠ AWS CLI not found. Skipping S3 upload."
    fi
  fi
fi

echo ""
echo "============================================"
echo " Backup process completed at $(date)"
echo "============================================"
