# ===========================================================
# PostgreSQL 16 + pgvector + PostGIS
# ===========================================================
# Base: pgvector/pgvector:pg16 (includes pgvector extension)
# Added: PostGIS for geospatial queries (ST_DWithin, geometry)
# ===========================================================
FROM pgvector/pgvector:pg16

# Install PostGIS on top of pgvector image
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       postgresql-16-postgis-3 \
       postgresql-16-postgis-3-scripts \
    && rm -rf /var/lib/apt/lists/*
