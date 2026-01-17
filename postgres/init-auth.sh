#!/bin/bash
set -e

# This script runs after PostgreSQL initialization to configure authentication
# It updates pg_hba.conf to allow all connections with trust (no password for local dev)

PG_HBA_FILE="${PGDATA}/pg_hba.conf"

# Wait for PostgreSQL to be ready
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 1
done

# Backup original file
cp "$PG_HBA_FILE" "${PG_HBA_FILE}.backup"

# Replace scram-sha-256 with trust for all hosts
sed -i 's/scram-sha-256/trust/g' "$PG_HBA_FILE"
sed -i 's/md5/trust/g' "$PG_HBA_FILE"

# Reload PostgreSQL to apply changes
pg_ctl reload -D "$PGDATA"

echo "PostgreSQL authentication configured for local development (trust mode)"
