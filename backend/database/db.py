import mysql.connector
from flask import current_app
from mysql.connector import pooling
from mysql.connector import Error
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection pool
connection_pool = None

def initialize_pool():
    """Initialize the database connection pool"""
    global connection_pool
    try:
        connection_pool = pooling.MySQLConnectionPool(
            pool_name="edu_pool",
            pool_size=5,
            pool_reset_session=True,
            host=current_app.config['DB_HOST'],
            user=current_app.config['DB_USER'],
            password=current_app.config['DB_PASSWORD'],
            database=current_app.config['DB_NAME'],
            autocommit=True  # Enable autocommit by default
        )
        logger.info("Database connection pool created successfully")
    except Error as e:
        logger.error(f"Error while creating database connection pool: {e}")
        raise

def get_db_connection():
    """Get a database connection from the pool"""
    try:
        if connection_pool is None:
            initialize_pool()
        
        connection = connection_pool.get_connection()
        logger.debug("Database connection retrieved from pool")
        return connection
    except Error as e:
        logger.error(f"Error while getting database connection: {e}")
        raise

def close_db_connection(connection, cursor=None):
    """Return a database connection to the pool"""
    try:
        if cursor:
            cursor.close()
            logger.debug("Database cursor closed")
        if connection:
            connection.close()
            logger.debug("Database connection returned to pool")
    except Error as e:
        logger.error(f"Error while closing database connection: {e}")
        raise

def check_database_connection():
    """Check if database connection is working"""
    connection = None
    try:
        connection = get_db_connection()
        if connection.is_connected():
            db_info = connection.get_server_info()
            logger.info(f"Successfully connected to MySQL Server version {db_info}")
            return True
        return False
    except Error as e:
        logger.error(f"Database connection failed: {e}")
        return False
    finally:
        if connection:
            close_db_connection(connection)

def execute_query(query, params=None, fetch_one=False):
    """Execute a SQL query and return results"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(query, params or ())
        
        if query.strip().upper().startswith('SELECT'):
            if fetch_one:
                result = cursor.fetchone()
            else:
                result = cursor.fetchall()
            logger.debug(f"Query executed successfully: {query}")
            return result
        else:
            # For non-SELECT queries, return affected row count
            logger.debug(f"Query executed successfully: {query}")
            return cursor.rowcount
            
    except Error as e:
        logger.error(f"Error executing query: {query}. Error: {e}")
        raise
    finally:
        close_db_connection(connection, cursor)

def execute_transaction(queries):
    """Execute multiple queries as a transaction"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        connection.autocommit = False  # Disable autocommit for transaction
        cursor = connection.cursor(dictionary=True)
        
        results = []
        for query, params in queries:
            cursor.execute(query, params or ())
            if query.strip().upper().startswith('SELECT'):
                results.append(cursor.fetchall())
            else:
                results.append(cursor.rowcount)
        
        connection.commit()
        logger.info("Transaction committed successfully")
        return results
    except Error as e:
        if connection:
            connection.rollback()
        logger.error(f"Transaction failed: {e}")
        raise
    finally:
        if connection:
            connection.autocommit = True  # Reset to default
        close_db_connection(connection, cursor)