-- Database initialization script for A2A project
-- Creates proper users for NPL engine and Keycloak

-- Create database for Keycloak
CREATE DATABASE keycloak;

-- Create engine user with proper privileges
CREATE ROLE engine LOGIN PASSWORD 'engine123' NOINHERIT;
GRANT CREATE ON DATABASE platform TO engine;

-- Create Keycloak user
CREATE ROLE keycloak LOGIN PASSWORD 'keycloak123' NOINHERIT;
GRANT CREATE ON DATABASE keycloak TO keycloak;

-- Grant necessary privileges
GRANT ALL PRIVILEGES ON DATABASE platform TO engine;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;

-- Connect to platform database and set up engine schema
\c platform;

-- Create engine schema
CREATE SCHEMA IF NOT EXISTS "engine-schema";
GRANT ALL ON SCHEMA "engine-schema" TO engine;

-- Connect to keycloak database
\c keycloak;

-- Create keycloak schema
CREATE SCHEMA IF NOT EXISTS "keycloak";
GRANT ALL ON SCHEMA "keycloak" TO keycloak; 