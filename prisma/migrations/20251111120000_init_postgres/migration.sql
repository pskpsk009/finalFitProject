-- Migration: init_postgres
-- Generated to match the current Prisma schema (User, Log)

-- Create "User" table
CREATE TABLE IF NOT EXISTS "User" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL,
  "height" DOUBLE PRECISION NOT NULL
);

-- Create "Log" table
CREATE TABLE IF NOT EXISTS "Log" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
