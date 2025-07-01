-- Initialize NPL Engine Database
-- Create dedicated users for the engine application

-- Create engine user (noinherit is good practice)
CREATE ROLE engine LOGIN PASSWORD 'engine123' NOINHERIT;
GRANT CREATE ON DATABASE platform TO engine;

-- Create read_model user for read model operations
CREATE ROLE read_model LOGIN PASSWORD 'readmodel123' NOINHERIT;
GRANT CONNECT ON DATABASE platform TO read_model;

-- Create history user for history operations
CREATE ROLE history LOGIN PASSWORD 'history123' NOINHERIT;
GRANT CONNECT ON DATABASE platform TO history;

-- Grant necessary privileges
GRANT USAGE ON SCHEMA public TO engine, read_model, history;
GRANT CREATE ON SCHEMA public TO engine;

-- Create the engine schema
CREATE SCHEMA IF NOT EXISTS "engine-schema";
GRANT ALL ON SCHEMA "engine-schema" TO engine;

-- Create the history schema
CREATE SCHEMA IF NOT EXISTS "history-schema";
GRANT ALL ON SCHEMA "history-schema" TO history; 