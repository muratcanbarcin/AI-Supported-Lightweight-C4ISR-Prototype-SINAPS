#!/bin/bash
# Password authentication stays in force.
# This script used to rewrite pg_hba.conf to trust. That bypass is removed
# so a published PostgreSQL port cannot accept unauthenticated clients.
# Set POSTGRES_PASSWORD in the repository root .env before `docker compose up`.
echo "PostgreSQL password authentication left unchanged."
