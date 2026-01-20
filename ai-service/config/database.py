"""
Database Connection Manager
Provides connection pooling and utilities for PostgreSQL with pgvector
"""

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from typing import Optional, Generator
import structlog

from .settings import settings

logger = structlog.get_logger(__name__)


class DatabaseManager:
    """Manages PostgreSQL connection pool with pgvector support"""
    
    _instance: Optional['DatabaseManager'] = None
    _pool: Optional[pool.ThreadedConnectionPool] = None
    
    def __new__(cls):
        """Singleton pattern for database manager"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def initialize(self, use_docker_network: bool = False) -> None:
        """
        Initialize the connection pool
        
        Args:
            use_docker_network: If True, use Docker internal network URL
        """
        if self._pool is not None:
            logger.info("Connection pool already initialized")
            return
        
        db_url = settings.DATABASE_URL_DOCKER if use_docker_network else settings.DATABASE_URL
        
        try:
            self._pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=settings.DB_POOL_SIZE + settings.DB_MAX_OVERFLOW,
                dsn=db_url
            )
            logger.info(
                "Database connection pool initialized",
                pool_size=settings.DB_POOL_SIZE,
                use_docker=use_docker_network
            )
            
            # Verify pgvector extension
            self._verify_pgvector()
            
        except Exception as e:
            logger.error("Failed to initialize database pool", error=str(e))
            raise
    
    def _verify_pgvector(self) -> None:
        """Verify that pgvector extension is available"""
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT extname FROM pg_extension WHERE extname = 'vector'")
                result = cur.fetchone()
                if result:
                    logger.info("pgvector extension verified")
                else:
                    logger.warning("pgvector extension not found - run init-vector.sql")
    
    @contextmanager
    def get_connection(self) -> Generator[psycopg2.extensions.connection, None, None]:
        """
        Context manager for getting a connection from the pool
        
        Yields:
            PostgreSQL connection object
        """
        if self._pool is None:
            raise RuntimeError("Database pool not initialized. Call initialize() first.")
        
        conn = None
        try:
            conn = self._pool.getconn()
            yield conn
            conn.commit()
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error("Database error", error=str(e))
            raise
        finally:
            if conn:
                self._pool.putconn(conn)
    
    @contextmanager
    def get_cursor(self, dict_cursor: bool = True):
        """
        Context manager for getting a cursor with automatic connection handling
        
        Args:
            dict_cursor: If True, use RealDictCursor for dict-like row access
            
        Yields:
            Database cursor
        """
        cursor_factory = RealDictCursor if dict_cursor else None
        
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=cursor_factory)
            try:
                yield cursor
            finally:
                cursor.close()
    
    def close(self) -> None:
        """Close all connections in the pool"""
        if self._pool is not None:
            self._pool.closeall()
            self._pool = None
            logger.info("Database connection pool closed")


# Global database manager instance
db_manager = DatabaseManager()


def initialize_database(use_docker_network: bool = False) -> None:
    """Initialize the global database manager"""
    db_manager.initialize(use_docker_network)


def close_database() -> None:
    """Close the global database manager"""
    db_manager.close()
