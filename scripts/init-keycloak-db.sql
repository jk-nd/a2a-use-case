-- Initialize Keycloak Database
-- Create dedicated user for Keycloak

-- Create keycloak user
CREATE ROLE keycloak LOGIN PASSWORD 'keycloak123' NOINHERIT;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;
GRANT ALL PRIVILEGES ON SCHEMA public TO keycloak; 