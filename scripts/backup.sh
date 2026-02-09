#!/bin/bash
# ================================================
# E-Ticaret Backup Script
# ================================================
# This script performs automated backups of:
# - PostgreSQL database
# - Uploaded files (images, documents)
# 
# Recommended cron schedule (daily at 2 AM):
# 0 2 * * * /opt/eticaret/scripts/backup.sh >> /var/log/eticaret-backup.log 2>&1
# ================================================

set -e

# ================================================
# Configuration
# ================================================
BACKUP_DIR="/opt/eticaret/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Docker compose file location
COMPOSE_FILE="/opt/eticaret/docker-compose.production.yml"

# Database credentials (from environment or .env file)
DB_CONTAINER="eticaret-postgres"
DB_NAME="${DB_NAME:-eticaret_db}"
DB_USER="${DB_USER:-admin}"

# S3 Configuration (optional)
S3_BUCKET="${S3_BUCKET:-}"
AWS_REGION="${AWS_REGION:-eu-central-1}"

# ================================================
# Colors for output
# ================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ================================================
# Functions
# ================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

create_backup_dir() {
    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/uploads"
    mkdir -p "$BACKUP_DIR/logs"
}

backup_database() {
    log_info "Starting database backup..."
    
    local backup_file="$BACKUP_DIR/database/db_${DATE}.sql"
    
    # Create database dump
    docker exec -t $DB_CONTAINER pg_dump \
        -U $DB_USER \
        -d $DB_NAME \
        --format=custom \
        --compress=9 \
        > "${backup_file}.gz"
    
    if [ $? -eq 0 ]; then
        local size=$(du -h "${backup_file}.gz" | cut -f1)
        log_info "Database backup completed: ${backup_file}.gz ($size)"
    else
        log_error "Database backup failed!"
        return 1
    fi
}

backup_uploads() {
    log_info "Starting uploads backup..."
    
    local backup_file="$BACKUP_DIR/uploads/uploads_${DATE}.tar.gz"
    
    # Get uploads volume path
    local uploads_volume=$(docker volume inspect eticaret_backend_uploads --format '{{ .Mountpoint }}' 2>/dev/null || echo "")
    
    if [ -n "$uploads_volume" ] && [ -d "$uploads_volume" ]; then
        tar -czf "$backup_file" -C "$uploads_volume" .
        
        if [ $? -eq 0 ]; then
            local size=$(du -h "$backup_file" | cut -f1)
            log_info "Uploads backup completed: $backup_file ($size)"
        else
            log_error "Uploads backup failed!"
            return 1
        fi
    else
        log_warn "Uploads volume not found, skipping uploads backup"
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Database backups
    find "$BACKUP_DIR/database" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # Uploads backups
    find "$BACKUP_DIR/uploads" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    log_info "Cleanup completed"
}

upload_to_s3() {
    if [ -z "$S3_BUCKET" ]; then
        log_info "S3 bucket not configured, skipping cloud upload"
        return 0
    fi
    
    log_info "Uploading backups to S3..."
    
    # Upload database backup
    aws s3 cp "$BACKUP_DIR/database/db_${DATE}.sql.gz" \
        "s3://$S3_BUCKET/backups/database/" \
        --region $AWS_REGION
    
    # Upload uploads backup if exists
    if [ -f "$BACKUP_DIR/uploads/uploads_${DATE}.tar.gz" ]; then
        aws s3 cp "$BACKUP_DIR/uploads/uploads_${DATE}.tar.gz" \
            "s3://$S3_BUCKET/backups/uploads/" \
            --region $AWS_REGION
    fi
    
    log_info "S3 upload completed"
}

send_notification() {
    local status=$1
    local message=$2
    
    # Slack notification (if webhook is configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        local emoji="✅"
        
        if [ "$status" != "success" ]; then
            color="danger"
            emoji="❌"
        fi
        
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"text\": \"$emoji E-Ticaret Backup: $message\"
                }]
            }" > /dev/null 2>&1 || true
    fi
}

# ================================================
# Main
# ================================================

main() {
    log_info "=========================================="
    log_info "Starting E-Ticaret Backup Process"
    log_info "=========================================="
    
    # Create backup directories
    create_backup_dir
    
    local errors=0
    
    # Backup database
    if ! backup_database; then
        ((errors++))
    fi
    
    # Backup uploads
    if ! backup_uploads; then
        ((errors++))
    fi
    
    # Upload to S3 (optional)
    if ! upload_to_s3; then
        ((errors++))
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Summary
    log_info "=========================================="
    if [ $errors -eq 0 ]; then
        log_info "Backup completed successfully!"
        send_notification "success" "Backup completed successfully (${DATE})"
    else
        log_error "Backup completed with $errors error(s)"
        send_notification "failure" "Backup completed with errors (${DATE})"
        exit 1
    fi
    log_info "=========================================="
}

# ================================================
# Restore Functions (for manual use)
# ================================================

restore_database() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        echo "Usage: $0 restore-db <backup_file>"
        exit 1
    fi
    
    log_info "Restoring database from: $backup_file"
    
    # Decompress if needed
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker exec -i $DB_CONTAINER pg_restore \
            -U $DB_USER \
            -d $DB_NAME \
            --clean \
            --if-exists
    else
        cat "$backup_file" | docker exec -i $DB_CONTAINER pg_restore \
            -U $DB_USER \
            -d $DB_NAME \
            --clean \
            --if-exists
    fi
    
    log_info "Database restore completed"
}

restore_uploads() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        echo "Usage: $0 restore-uploads <backup_file>"
        exit 1
    fi
    
    log_info "Restoring uploads from: $backup_file"
    
    local uploads_volume=$(docker volume inspect eticaret_backend_uploads --format '{{ .Mountpoint }}')
    
    tar -xzf "$backup_file" -C "$uploads_volume"
    
    log_info "Uploads restore completed"
}

# ================================================
# Command Line Interface
# ================================================

case "${1:-}" in
    "restore-db")
        restore_database "$2"
        ;;
    "restore-uploads")
        restore_uploads "$2"
        ;;
    "")
        main
        ;;
    *)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (none)           Run full backup"
        echo "  restore-db       Restore database from backup file"
        echo "  restore-uploads  Restore uploads from backup file"
        exit 1
        ;;
esac
