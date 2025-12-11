#!/usr/bin/env python3
"""
Database creation script
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('config/config.local.env')

DB_HOST = "aidev-pgvector-dev.crkgaskg6o61.ap-northeast-2.rds.amazonaws.com"
DB_USER = "postgres"
DB_PASSWORD = "vmcMrs75!KZHk2johkRR:]wL"
DB_PORT = 5432
DB_NAME = "PS-UI-test3"

def create_database():
    """Create database if it doesn't exist"""
    try:
        # Connect to PostgreSQL server
        conn = psycopg2.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            database='postgres'  # Connect to default postgres database
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (DB_NAME,)
        )
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(f'CREATE DATABASE "{DB_NAME}"')
            print(f"Database '{DB_NAME}' created successfully")
        else:
            print(f"Database '{DB_NAME}' already exists")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error creating database: {e}")
        raise

if __name__ == "__main__":
    create_database()

